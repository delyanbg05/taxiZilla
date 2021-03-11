import { Body, Controller, Get, Post, Request, Session, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { session } from 'passport';
import { parse } from 'path';
import { UserRoles } from 'src/auth/enums/userRoles.enum';
import { User } from 'src/auth/user.entity';
import { taxiOrder } from './order.entity';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
    constructor(
        private orderService:OrderService,

    ){};
    @Post('/rejectOrderAfterAccept')
    async rejectOrderAfterAccept(@Session() session: {token?: string, role?:string}, @Body("orderID") orderID:string, @Body("senderID") senderID:string)
    {
        if(!session.token || session.role != UserRoles.DRIVER) throw new UnauthorizedException();
        this.orderService.rejectAfterAccept(session, parseInt(orderID), parseInt(senderID));
    }
    @Post('/createOrder')
    createOrder(@Body('x') x:number,@Body('y') y:number, @Body('notes') notes:string, @Body('address') address:string, @Session() session:{token?:string}, @Request() req:Request)
    {
        if(!session.token)throw new UnauthorizedException();
        const ip = req.headers["cf-connecting-ip"];
        return this.orderService.createOrder(x,y,notes, session, address, ip);
    }
    @Post("/acceptOrder/")
    async acceptOrder(@Session() session:{token?:string, role?:string})
    {
        if(!session.token || session.role != UserRoles.DRIVER)throw new UnauthorizedException();
        return this.orderService.acceptRequest(session);
    }
    @Post("/rejectOrder/")
    async rejectOrder(@Session() session:{token?:string, role?:string})
    {
        if(!session.token || session.role != UserRoles.DRIVER)throw new UnauthorizedException();
        return this.orderService.rejectRequest(session);
    }
    @Post("/finishOrder/")
    async finishOrder(@Session() session:{token?:string, role?:string}, @Body('id') id:string)
    {
        if(!session.token || session.role != UserRoles.DRIVER) throw new UnauthorizedException();
        this.orderService.finishOrder(Number(id));
    }
    @Get("/getAllOrders")
    async getAllOrders(@Session() session:{token?:string, role?:string})
    {
        if(!session.token || (session.role!=UserRoles.ADMIN&&session.role!=UserRoles.MODERATOR)) throw new UnauthorizedException();
        return await this.orderService.getAllOrders(session);
    }
    @Get("/getOrdersByUser")
    async getOrdersByUser(@Session() session:{token?:string})
    {
        if(!session.token) throw new UnauthorizedException();
        return await this.orderService.getOrdersByUser(session);
    }
    @Get("/getOrdersByDriver")
    async getOrdersByDriver(@Session() session:{token?:string, role?:string})
    {
        if(!session.token || session.role != UserRoles.DRIVER) throw new UnauthorizedException();
        return await this.orderService.getOrdersByDriver(session);
    }
    @Post("/removeOrder")
    async removeOrder(@Session() session:{token?:string, role?:string}, @Body("orderId") orderId:string)
    {
        if(!session.token ||session.role != UserRoles.ADMIN)throw new UnauthorizedException();
        return await this.orderService.removeOrder(parseInt(orderId));
    }

}

