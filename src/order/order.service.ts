import { Injectable, Session } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { tmpdir } from 'os';
import { UserRoles } from 'src/auth/enums/userRoles.enum';
import { UserStatus } from 'src/auth/enums/userStatus.enum';
import { taxiDriver, taxiDriversFindNearest } from 'src/auth/taxiDriver.class';
import { UserRepository } from 'src/auth/user.repository';
import { Statuses, Drivers,x,y, Requests } from 'src/coordsAndStatus.array';
import { OrderRepository } from './order.repository';

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(UserRepository)
        private userRepository:UserRepository,
        @InjectRepository(OrderRepository)
        private orderRepository:OrderRepository,
        private jwtService:JwtService,
            
    ){};
    async rejectRequest(@Session() session:{token?:string})
    {
        let uemail = await this.jwtService.decode(session.token);
        let user = await this.userRepository.findOne({email:uemail["email"]});
        if(Requests[user.id])
        {
            if(Requests[user.id]["curdriveridx"]<Requests[user.id]["distances"].length)
            {
                Requests[user.id]["status"]=0;
                if(Requests[user.id]["distances"][Requests[user.id]["curdriveridx"]+1])
                {
                Requests[Requests[user.id]["distances"][Requests[user.id]["curdriveridx"]+1]["index"]]=Requests[user.id];
                }
                else
                {

                }
                Requests[user.id]=undefined;
            }
            

        }
    }
    async createOrder(x:number,y:number, notes:string, @Session() session:{token?:string}, address: string)
    {
        let uemail = await this.jwtService.decode(session.token);
        let sended = await this.userRepository.findOne({email:uemail["email"]});
        let a:taxiDriversFindNearest = new taxiDriversFindNearest(x,y,sended,notes, address);
        a.getTheNearestDriver();
    }
    async getMyOrders(@Session() session:{token?:string})
    {
        let uemail = await this.jwtService.decode(session.token);
        let user = await this.userRepository.findOne({email:uemail["email"]});
        if(user.role==UserRoles.DRIVER)
        {
            return Requests[user.id]; 
        }
        else
        {
            return false;
        }
    }
    async getOrderOneSender()
    {
        const order = await this.orderRepository.getOrderById(1);
        return order.userOrdered;
    }
    async acceptRequest(@Session() session:{token?:string})
    {
        let uemail = await this.jwtService.decode(session.token);
        let user = await this.userRepository.findOne({email:uemail["email"]});
        if(Requests[user.id])
        {
            Requests[user.id]["status"]=1;
            this.orderRepository.createOrder(Requests[user.id]["sender"],user,Requests[user.id]["x"],Requests[user.id]["y"], Requests[user.id]["notes"], Requests[user.id]["address"]); 
            Requests[user.id] = undefined;
        }
    }

}
