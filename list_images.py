import os
import shutil

src_dir = "/Users/rudra/.gemini/antigravity/brain/6e5d2687-705b-4c77-9e94-058bb56098e7/.tempmediaStorage"
dest_dir = "/Users/rudra/Downloads/create-anything/apps/mobile/assets/images"

files = [f for f in os.listdir(src_dir) if f.endswith('.png')]
files.sort(key=lambda x: os.path.getmtime(os.path.join(src_dir, x)), reverse=True)

for i, f in enumerate(files[:5]):
    print(f"{i}: {f}")
