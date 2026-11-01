# -*- coding: utf-8 -*-
"""
scripts/make-sample-cv-pdf.py
Tạo một CV PDF mẫu (tiếng Việt có dấu) để kiểm thử chức năng đọc PDF.

Chạy:  python scripts/make-sample-cv-pdf.py
Kết quả: sample-data/cv-mau-ung-vien.pdf
"""
import os
import sys

from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "sample-data", "cv-mau-ung-vien.pdf")

FONT_CANDIDATES = [
    r"C:\Windows\Fonts\arial.ttf",
    r"C:\Windows\Fonts\segoeui.ttf",
    r"C:\Windows\Fonts\times.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]


def pick_font():
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            pdfmetrics.registerFont(TTFont("CVFont", path))
            return "CVFont"
    return "Helvetica"


LINES = [
    ("title", "HỌ VÀ TÊN: NGUYỄN THỊ LAN PHƯƠNG"),
    ("body", "Email: lanphuong.nguyen.test@gmail.com"),
    ("body", "Điện thoại: 0977 123 456"),
    ("body", "Địa chỉ: 18 Trần Duy Hưng, Cầu Giấy, Hà Nội"),
    ("body", "Giới tính: Nữ  -  Ngày sinh: 20/07/1998"),
    ("gap", ""),
    ("head", "HỌC VẤN:"),
    ("body", "- Cử nhân Công nghệ Thông tin - Đại học Bách Khoa Hà Nội (2016 - 2020), loại Giỏi."),
    ("gap", ""),
    ("head", "KINH NGHIỆM LÀM VIỆC:"),
    ("body", "- 2022 - Nay (4 năm): Frontend Developer tại Công ty Giải pháp Sao Việt"),
    ("body", "  + Phát triển giao diện React, TypeScript, Tailwind CSS cho hệ thống ERP."),
    ("body", "  + Tối ưu hiệu năng, giảm thời gian tải trang 40%."),
    ("body", "- 2020 - 2022 (2 năm): Web Developer tại FPT Software"),
    ("body", "  + Xây dựng module quản trị với JavaScript, Node.js, MongoDB."),
    ("gap", ""),
    ("head", "KỸ NĂNG CHUYÊN MÔN:"),
    ("body", "- React, TypeScript, JavaScript, Next.js, Tailwind CSS, Redux"),
    ("body", "- Node.js, RESTful API, MongoDB, SQL, Git, Docker"),
    ("gap", ""),
    ("head", "CHỨNG CHỈ:"),
    ("body", "- IELTS 7.0 (2024)"),
    ("body", "- AWS Certified Cloud Practitioner (2023)"),
]


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    font = pick_font()
    c = canvas.Canvas(OUT, pagesize=A4)
    width, height = A4

    y = height - 60
    for style, text in LINES:
        if style == "gap":
            y -= 10
            continue
        if style == "title":
            c.setFont(font, 14)
        elif style == "head":
            c.setFont(font, 12)
        else:
            c.setFont(font, 10.5)
        c.drawString(55, y, text)
        y -= 18
        if y < 60:
            c.showPage()
            y = height - 60

    c.save()
    print("Da tao PDF:", OUT, "| font:", font)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print("Loi tao PDF:", exc)
        sys.exit(1)
