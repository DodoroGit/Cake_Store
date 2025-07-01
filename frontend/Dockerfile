FROM nginx:alpine

# 拿掉預設的 html 檔案
RUN rm -rf /usr/share/nginx/html/*

# 複製 HTML 與靜態資源
COPY html/ /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/

# 複製自訂的 nginx 設定檔
COPY nginx.conf /etc/nginx/nginx.conf
