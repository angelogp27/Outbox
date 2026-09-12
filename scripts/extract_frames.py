import cv2
import os
from pathlib import Path

def extract_frames():
    video_path = Path("Resources/Shopping_cart_moving_down_aisle_20260912141317.mp4")
    out_dir = Path("public/frames")
    out_dir.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(str(video_path))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Total video frames: {total_frames}")

    # Extraer 100 frames uniformemente distribuidos para un scrubbing ultrasuave
    target_count = 100
    indices = [int(i * (total_frames - 1) / (target_count - 1)) for i in range(target_count)]

    saved_count = 0
    current_frame = 0
    
    for target_idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, target_idx)
        ret, frame = cap.read()
        if ret:
            # Redimensionar a 960x540 para máximo rendimiento y nitidez
            resized = cv2.resize(frame, (960, 540), interpolation=cv2.INTER_AREA)
            out_file = out_dir / f"frame_{saved_count:03d}.jpg"
            cv2.imwrite(str(out_file), resized, [cv2.IMWRITE_JPEG_QUALITY, 85])
            saved_count += 1

    cap.release()
    print(f"Extracted {saved_count} frames to {out_dir}")

if __name__ == "__main__":
    extract_frames()
