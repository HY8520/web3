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

//const mainName string = "main"
//
//var mainVar string = getMainVar()
//
//func init() {
//	fmt.Println("main init method invoked")
//}
//
//func main() {
//	fmt.Println("main method invoked!")
//}
//
//func getMainVar() string {
//	fmt.Println("main.getMainVar method invoked!")
//	return mainName
//}

type PayMethod interface {
	Pay(int)
}

type CreditCard struct {
	balance int
	limit   int
}

func (c *CreditCard) Pay(amout int) {
	if c.balance < amout {
		fmt.Println("余额不足")
		return
	}
	c.balance -= amout
}

func anyParam(param interface{}) {
	fmt.Println("param: ", param)
}

func main() {
	c := CreditCard{balance: 100, limit: 1000}
	c.Pay(200)
	var a PayMethod = &c
	fmt.Println("a.Pay: ", a)

	var b interface{} = &c
	fmt.Println("b: ", b)

	anyParam(c)
	anyParam(1)
	anyParam("123")
	anyParam(a)
}
