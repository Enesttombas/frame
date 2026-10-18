"""Build an original, locally narrated sample lesson; no downloaded media."""
import json, re, subprocess, wave
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
MEDIA = ROOT / 'media'
captions = ['Small steps.\nReal change.', 'A little,\nevery day.', 'Consistency\nover intensity.', 'Make room\nfor a routine.', 'Notice.\nUnderstand.\nRemember.', 'Give your memory\na moment.', 'Let it\nbuild.', 'Keep\ngoing.']
font = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 89)
small = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 22)
timings, cursor, combined = [], 0.0, bytearray()
params = None
for i, caption in enumerate(captions):
    with wave.open(str(MEDIA / f'voice-{i}.wav'), 'rb') as audio:
        current = (audio.getnchannels(), audio.getsampwidth(), audio.getframerate())
        assert params is None or params == current
        params = current
        data = audio.readframes(audio.getnframes())
    channels, width, rate = params
    pause = b'\0' * int(rate * 0.65) * channels * width
    duration = len(data) / (rate * channels * width) + 0.65
    timings.append({'start': round(cursor, 3), 'end': round(cursor + duration, 3)})
    cursor += duration
    combined.extend(data + pause)
    picture = Image.new('RGB', (1280, 720), '#203a35')
    draw = ImageDraw.Draw(picture)
    # Native geometric composition: a growing path, echoed by the lesson theme.
    for j in range(9):
        x = 860 + j * 38
        height = 90 + j * 48
        draw.rounded_rectangle((x, 650 - height, x + 23, 650), radius=11, fill='#40594e' if j > i else '#bfd09c')
    draw.text((74, 66), 'FRAME  /  ORIGINAL LESSON', font=small, fill='#c5cfbf')
    draw.multiline_text((72, 202), caption, font=font, fill='#f5f0df', spacing=13)
    draw.text((76, 648), 'SMALL STEPS, LASTING CHANGE', font=small, fill='#c5cfbf')
    draw.text((1190, 66), f'{i + 1:02}', font=small, fill='#c5cfbf')
    picture.save(MEDIA / f'slide-{i}.png')
with wave.open(str(MEDIA / 'lesson.wav'), 'wb') as out:
    out.setnchannels(params[0]); out.setsampwidth(params[1]); out.setframerate(params[2]); out.writeframes(bytes(combined))
with (MEDIA / 'slides.txt').open('w', encoding='utf-8') as stream:
    for i, timing in enumerate(timings):
        stream.write(f"file 'slide-{i}.png'\nduration {timing['end'] - timing['start']:.3f}\n")
    stream.write("file 'slide-7.png'\n")
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(MEDIA / 'slides.txt'), '-i', str(MEDIA / 'lesson.wav'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '24', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', str(MEDIA / 'lesson.mp4')], check=True)
(ROOT / 'timings.js').write_text('window.FRAME_TIMINGS = ' + json.dumps(timings) + ';\n', encoding='utf-8')
print(json.dumps({'seconds': round(cursor, 3), 'cues': len(timings), 'video_bytes': (MEDIA / 'lesson.mp4').stat().st_size}))
