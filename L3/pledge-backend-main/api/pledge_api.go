package main

import (
	"pledge-backend/api/middlewares"
	"pledge-backend/api/models"
	"pledge-backend/api/models/kucoin"
	"pledge-backend/api/models/ws"
	"pledge-backend/api/routes"
	"pledge-backend/api/static"
	"pledge-backend/api/validate"
	"pledge-backend/config"
	"pledge-backend/db"

	"github.com/gin-gonic/gin"
)

func main() {

	//init mysql
	db.InitMysql()

	//init redis
	db.InitRedis()
	models.InitTable()

	//gin bind go-playground-validator
	validate.BindingValidator()

	// websocket server
	go ws.StartServer()

	// get plgr price from kucoin-exchange
	go kucoin.GetExchangePrice()

	// gin start
	gin.SetMode(gin.ReleaseMode)
	app := gin.Default()
	// 获取当前文件路径
	staticPath := static.GetCurrentAbPathByCaller()
	// 设置静态文件目录,如果 staticPath 指向一个包含图片的目录，客户端可以通过 /storage/image.jpg
	app.Static("/storage/", staticPath)
	//跨域中间件
	app.Use(middlewares.Cors()) // 「 Cross domain Middleware 」
	//初始化路由
	routes.InitRoute(app)
	//启动服务器
	_ = app.Run(":" + config.Config.Env.Port)

}

/*
 If you change the version, you need to modify the following files'
 config/init.go
*/
