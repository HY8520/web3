package main

import "fmt"

//var str string = "Hello, world!"
//
//func main() {
//	//fmt.Println("Hello, world!")
//	persfase(str)
//}
//
//func persfase(s string) {
//	fmt.Println(s)
//}

const mainName string = "main"

var mainVar string = getMainVar()

func init() {
	fmt.Println("main init method invoked")
}

func main() {
	fmt.Println("main method invoked!")
}

func getMainVar() string {
	fmt.Println("main.getMainVar method invoked!")
	return mainName
}
