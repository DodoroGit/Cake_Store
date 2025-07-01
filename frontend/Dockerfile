# frontend/Dockerfile
FROM nginx:alpine

# 移除預設頁面
RUN rm -rf /usr/share/nginx/html/*

# 複製你的 HTML / CSS 到 Nginx 目錄
COPY html/ /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/
