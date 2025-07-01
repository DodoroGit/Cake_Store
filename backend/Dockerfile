# backend/Dockerfile
FROM golang:1.21-alpine

WORKDIR /app

# 複製 go.mod 和 go.sum 先安裝依賴
COPY go.mod go.sum ./
RUN go mod download

# 複製整個 backend 原始碼
COPY . .

# 編譯
RUN go build -o main .

# 執行
CMD ["./main"]
