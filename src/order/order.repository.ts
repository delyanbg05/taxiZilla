import { User } from "src/auth/user.entity";
import { EntityRepository, Repository } from "typeorm";
import { OrderStatus } from "./enums/orderStatus.enum";
import { taxiOrder } from "./order.entity";

@EntityRepository(taxiOrder)
export class OrderRepository extends Repository<taxiOrder>
{
    async createOrder(sender:User,driver:User,x:number,y:number, notes:string, address:string)
    {
        let newOrder = new taxiOrder();
        newOrder.x=x;
        newOrder.y=y;
        newOrder.
        address = address;
        newOrder.notes = notes;
        newOrder.orderStatus=OrderStatus.Open;
        newOrder.userOrdered=sender;
        newOrder.driverId=driver.id;
        newOrder.items = "";
        await newOrder.save();
        await sender.save();
        return newOrder;
    }
    async getOrderById(id:number)
    {
        const order = await this.findOne({id});
        return order;
    }
    async getOrderByUser(user:User)
    {
        let qb = this.createQueryBuilder("order");
        qb.andWhere("order.driverId = :userid",{userid:user.id});
        qb.andWhere("order.orderStatus = :orderStatus",{orderStatus:OrderStatus.Open});
        return await qb.getMany();
    }
}