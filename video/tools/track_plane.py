"""Слежение за плоскостью (стена, пол, здание вдали) с перспективой — рисунок «прилипает», как наклейка.

На опорном кадре берёт десятки точек внутри заданного многоугольника, ведёт их оптическим потоком
вперёд и назад по времени (с проверкой «туда-обратно»), по ним считает перспективное преобразование
(гомографию, RANSAC отбрасывает точки, закрытые рукой) и сглаживает движение углов.

Запуск из папки video/ (окружение ~/.venvs/matting: numpy + OpenCV):
  ~/.venvs/matting/bin/python tools/track_plane.py SRC START END REF "x1,y1 x2,y2 x3,y3 x4,y4" OUT.json [check.png]
Время — в исходнике, многоугольник — в пикселях 1080×1920 на кадре REF.
OUT.json: {"fps", "start", "ref", "h": [[9 чисел] на кадр]} — преобразование «кадр REF → текущий кадр».
"""

import json
import subprocess
import sys

import cv2
import numpy as np

W, H = 1080, 1920
SMOOTH_FRAMES = 2  # сигма сглаживания углов, кадров
# Режим «affine»: только сдвиг/поворот/масштаб, без подсева точек — для далёких объектов за окном,
# где перед ними проходят рамы (иначе трекер «хватается» за раму)
MODE = "plane"


def read_frames(src, t0, t1):
    p = subprocess.Popen(["/opt/homebrew/bin/ffmpeg", "-v", "error", "-ss", str(t0), "-t", str(t1 - t0), "-i", src,
                          "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], stdout=subprocess.PIPE)
    out = []
    while True:
        b = p.stdout.read(W * H)
        if len(b) < W * H:
            break
        out.append(np.frombuffer(b, np.uint8).reshape(H, W))
    return out


LK = dict(winSize=(31, 31), maxLevel=4, criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 40, 0.01))


def track_direction(frames, r, step, poly, ref_pts):
    """Ведёт точки от опорного кадра r в сторону step (+1/−1). Возвращает {кадр: H}."""
    hs = {r: np.eye(3)}
    ref = ref_pts.copy()  # координаты на опорном кадре
    cur = ref_pts.copy()  # координаты на текущем кадре
    i = r
    while 0 <= i + step < len(frames):
        a, b = frames[i], frames[i + step]
        if len(cur) == 0:
            i += step
            hs[i] = hs[i - step]
            continue
        nxt, st, _ = cv2.calcOpticalFlowPyrLK(a, b, cur, None, **LK)
        back, st2, _ = cv2.calcOpticalFlowPyrLK(b, a, nxt, None, **LK)
        fb = np.linalg.norm((back - cur).reshape(-1, 2), axis=1)
        ok = (st.ravel() == 1) & (st2.ravel() == 1) & (fb < 0.8)
        ref, cur = ref[ok], nxt[ok]
        i += step
        Hm = None
        if MODE == "affine" and len(cur) >= 6:
            A, inl = cv2.estimateAffinePartial2D(ref, cur, method=cv2.RANSAC, ransacReprojThreshold=2.0)
            if A is not None:
                Hm = np.vstack([A, [0, 0, 1]])
                inl = inl.ravel() == 1
                ref, cur = ref[inl], cur[inl]
        elif len(cur) >= 8:
            Hm, inl = cv2.findHomography(ref, cur, cv2.RANSAC, 2.0)
            if Hm is not None:
                inl = inl.ravel() == 1
                ref, cur = ref[inl], cur[inl]
        if Hm is None:
            Hm = hs[i - step]
        hs[i] = Hm
        # Подсев новых точек, когда старые теряются (рука закрыла, ушли за край)
        if len(cur) < (60 if MODE == "plane" else 40):
            m = np.zeros((H, W), np.uint8)
            proj = cv2.perspectiveTransform(poly.reshape(-1, 1, 2), Hm).astype(np.int32)
            cv2.fillPoly(m, [proj], 255)
            if MODE == "affine":
                # Не подхватывать точки на тёмной раме окна, проходящей перед объектом
                m[frames[i] < 90] = 0
            new = cv2.goodFeaturesToTrack(frames[i], 300, 0.01, 8, mask=m)
            if new is not None:
                back_ref = cv2.perspectiveTransform(new.astype(np.float32), np.linalg.inv(Hm))
                cur = np.vstack([cur, new.astype(np.float32)])
                ref = np.vstack([ref, back_ref.astype(np.float32)])
    return hs


def main(src, t0, t1, tref, poly_s, out, check=None):
    poly = np.array([[float(v) for v in p.split(",")] for p in poly_s.split()], np.float32)
    frames = read_frames(src, t0, t1)
    fps = 25
    r = round((tref - t0) * fps)
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, [poly.astype(np.int32)], 255)
    pts = cv2.goodFeaturesToTrack(frames[r], 400, 0.01, 8, mask=m)
    print(f"точек на опорном кадре: {len(pts)}", file=sys.stderr)
    hs = {**track_direction(frames, r, -1, poly, pts.astype(np.float32)),
          **track_direction(frames, r, +1, poly, pts.astype(np.float32))}

    # Сглаживание: ведём углы многоугольника, сглаживаем по времени, пересчитываем гомографию
    n = len(frames)
    corners = np.array([cv2.perspectiveTransform(poly.reshape(-1, 1, 2), hs[i]).reshape(-1, 2) for i in range(n)])
    k = np.exp(-0.5 * (np.arange(-3 * SMOOTH_FRAMES, 3 * SMOOTH_FRAMES + 1) / SMOOTH_FRAMES) ** 2)
    k /= k.sum()
    pad = len(k) // 2
    sm = np.empty_like(corners)
    for c in range(corners.shape[1]):
        for d in range(2):
            s = np.pad(corners[:, c, d], pad, mode="edge")
            sm[:, c, d] = np.convolve(s, k, mode="valid")
    result = []
    for i in range(n):
        Hm = cv2.getPerspectiveTransform(poly[:4], sm[i, :4].astype(np.float32)) if len(poly) == 4 else cv2.findHomography(poly, sm[i])[0]
        result.append([float(v) for v in (Hm / Hm[2, 2]).ravel()])
    json.dump({"fps": fps, "start": t0, "ref": tref, "h": result}, open(out, "w"))

    if check:
        # Проверка: контур на нескольких кадрах
        idx = np.linspace(0, n - 1, 6).astype(int)
        tiles = []
        for i in idx:
            img = cv2.cvtColor(frames[i], cv2.COLOR_GRAY2BGR)
            p = cv2.perspectiveTransform(poly.reshape(-1, 1, 2), np.array(result[i]).reshape(3, 3)).astype(np.int32)
            cv2.polylines(img, [p], True, (0, 220, 255), 6)
            tiles.append(cv2.resize(img, (270, 480)))
        cv2.imwrite(check, np.hstack(tiles))


if __name__ == "__main__":
    a = sys.argv[1:]
    if "--affine" in a:
        a.remove("--affine")
        MODE = "affine"
    main(a[0], float(a[1]), float(a[2]), float(a[3]), a[4], a[5], a[6] if len(a) > 6 else None)
