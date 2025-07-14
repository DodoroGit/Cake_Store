package handlers

import (
	"fmt"

	"github.com/DodoroGit/Cake_Store/database"
	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
)

func ExportOrdersHandler(c *gin.Context) {
	month := c.Query("month")
	if month == "" {
		c.JSON(400, gin.H{"error": "缺少月份"})
		return
	}

	rows, err := database.DB.Query(`
		SELECT o.order_number, u.name, o.created_at, o.status
		FROM orders o
		JOIN users u ON o.user_id = u.id
		WHERE TO_CHAR(o.created_at, 'YYYY-MM') = $1
	`, month)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	f := excelize.NewFile()
	sheet := "訂單"
	f.SetSheetName("Sheet1", sheet)

	headers := []string{"訂單編號", "姓名", "建立時間", "狀態"}
	for i, h := range headers {
		cell := fmt.Sprintf("%s1", string('A'+i))
		f.SetCellValue(sheet, cell, h)
	}

	rowNum := 2
	for rows.Next() {
		var orderNum, name, createdAt, status string
		rows.Scan(&orderNum, &name, &createdAt, &status)

		f.SetCellValue(sheet, fmt.Sprintf("A%d", rowNum), orderNum)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", rowNum), name)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", rowNum), createdAt)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", rowNum), status)
		rowNum++
	}

	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Disposition", "attachment; filename=\"orders.xlsx\"")
	f.Write(c.Writer)
}
