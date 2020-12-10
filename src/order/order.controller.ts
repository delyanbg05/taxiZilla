import { Body, Controller, Get, Post, Session } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
    constructor(
        private orderService:OrderService,

    ){};
    @Post('/createOrder')
    createOrder(@Body('x') x:number,@Body('y') y:number, @Body('notes') notes:string, @Session() session:{token?:string})
    {
        return this.orderService.createOrder(x,y,notes, session);
        
    }
    @Get('/getMyOrders')
    getMyOrders(@Session() session:{token?:string})
    {
        return this.orderService.getMyOrders(session);
    }
    @Post("/acceptOrder/")
    async acceptOrder(@Session() session:{token?:string})
    {
        return this.orderService.acceptRequest(session);
    }

}

