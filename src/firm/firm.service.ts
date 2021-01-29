import { Injectable, Session, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { join } from 'path';
import { RegisterFirmDTO } from './dto/registerFirm.dto';
import { FirmRepository } from './firm.repository';
import { JWTPayloadFirm } from './jwt-payload';
import * as Cryptr from 'cryptr';
import { transport } from 'src/email.transport';
import { decode } from 'punycode';
import { UserRoles } from 'src/auth/enums/userRoles.enum';
import { UserRepository } from 'src/auth/user.repository';
import { User } from 'src/auth/user.entity';
import { session } from 'passport';
import { Firm } from './firm.entity';
import { SupportedCityRepository } from './cityRepository';

@Injectable()
export class FirmService {
    constructor(
        private firmRepository:FirmRepository,
        private jwtService:JwtService,
        private userRepository:UserRepository,
        private cityRepository:SupportedCityRepository,
        ){};
    decode(data)
    {
      let result="";
    for(let i=6;i<data.length-6;i++)
    {
        let tmp = data.charCodeAt(i);
        tmp-=33;
        result+=("0" + tmp.toString()).slice(-2);
    }
    return result;
    }
    async removeFirmByAdmin(@Session()session:{token?:string},firmID:number)
    {
      let umail = await this.jwtService.decode(session.token);
      const user = await this.userRepository.findOne({ email: umail["email"]}); 
      if(user.role!==UserRoles.ADMIN)
      {
        throw new UnauthorizedException();
      }
      const firm = await this.firmRepository.findOne(firmID);
      firm.drivers.forEach(async(element) => {
        element.role = UserRoles.USER;
        await element.save();
      });
      firm.drivers = [];
      await firm.save();
      await firm.remove();
      return true;
    }
    async moderationVerifyFirm(@Session()session:{token?:string}, firmID:number)
    {
      let umail = await this.jwtService.decode(session.token);
      const user = await this.userRepository.findOne({ email: umail["email"]}); 
      if(user.role!==UserRoles.ADMIN)
      {
        throw new UnauthorizedException();
      }
      const firm = await this.firmRepository.findOne(firmID);
      firm.moderationVerified = true;
      await firm.save();
      return true;
    }
    async loginFirm(eik:string,password:string, @Session() session:{token?: string, type?:string})
    {
    const ver = await this.firmRepository.loginFirm(eik,password);
    if(!ver)
    {
        return false;
    }
    else
    {
        if(ver==="notVerified")
        {
            return ver;
        }
        else if(ver==="notModerationVerified")
        {
            return ver;
        }
        else
        {
            const payload:JWTPayloadFirm = {eik};
            const JWTToken = this.jwtService.sign(payload);
            session.token=JWTToken;
            session.type="Firm";
            return true;
        }
    }
    }
    async registerFirm(registerFirmDto:RegisterFirmDTO)
    {
        return await this.firmRepository.registerFirm(registerFirmDto); 
    }
    async sendVerifyFirm(registerFirmDto:RegisterFirmDTO)
  {
    const encrypter = new Cryptr("mXb35Bw^FvCz9MLN");
    const link = encrypter.encrypt(registerFirmDto.eik);
    const htmlcode = "<a href='http://localhost:3000/firm/verifyFirm/"+link+"'>ТУК</a>";
    const info = await transport.sendMail({
      from: "taxiZilla",
      to:registerFirmDto.email,
      subject: 'Потвърждение на email',
      html: '<b>За да потвърдите email адреса си натиснете</b> '+htmlcode+'<b>!</b>',
    });
    return "Sended";
  }
  getVerifyPage(verified:boolean):string
  {
    const fs = require("fs");
    if(verified === true) return fs.readFileSync(join(__dirname, "/../../staticFiles/pages/verifiedTrue.html")).toString();
    else return fs.readFileSync(join(__dirname, "/../../staticFiles/pages/verifiedFalse.html")).toString();
  }
  async getProfile(@Session() session:{token?: string, type?:string,role?:UserRoles})
  {
    const decoded=await this.jwtService.decode(session.token);
    const eik=decoded["eik"];
    const profile = this.firmRepository.getProfile(eik);
    return profile;
  }
  async verifyFirm(code:string)
  {
    const encrypter = new Cryptr("mXb35Bw^FvCz9MLN");
    const eik = encrypter.decrypt(code);
    let result = await this.firmRepository.verifyFirm(eik);
    return this.getVerifyPage(result);
  }
  async addTaxiDriver(@Session() session:{token?: string, type?:string,role?:UserRoles},email:string)
  {
    const driver:User = await this.userRepository.findOne({email});
    if(driver === undefined) return false;
    else{
    const decoded=await this.jwtService.decode(session.token);
    const eik=decoded["eik"];
    return this.firmRepository.addTaxiDriver(eik,driver);
    }
  }
  async removeTaxiDriver(@Session() session:{token?:string}, email:string)
  {
    const driver:User = await this.userRepository.findOne({email});
    const decoded=await this.jwtService.decode(session.token);
    const eik=decoded["eik"];
    return this.firmRepository.removeTaxiDriver(eik,driver, UserRoles.USER);

  }
  async getTaxiDrivers(@Session() session:{token?: string})
  {
    const decoded=await this.jwtService.decode(session.token);
    const eik=decoded["eik"];
    return await this.firmRepository.getTaxiDrivers(eik);
  }
  async addCity(city:string,region:string, @Session() session:{token?: string})
  {
      const decoded=await this.jwtService.decode(session.token);
      const eik=decoded["eik"];
      const firm = await this.firmRepository.findOne({eik});
      return await this.cityRepository.addCity(city,region,firm);
  }
  async addCityByAdmin(city:string,region:string, firmID:number)
  {
    const firm = await this.firmRepository.findOne(firmID);
    return await this.cityRepository.addCity(city,region,firm);
  }
  async removeCity(city:string,region:string, @Session() session:{token?: string})
  {
      const decoded=await this.jwtService.decode(session.token);
      const eik=decoded["eik"];
      const firm = await this.firmRepository.findOne({eik});
      return await this.cityRepository.removeCity(city,region,firm);
  }
  async getCitiesByFirm(@Session() session:{token?: string})
  {
    const decoded = await this.jwtService.decode(session.token);
    const eik=decoded["eik"];
    const firm = await this.firmRepository.findOne({eik});
    return await this.cityRepository.getCitiesByFirm(firm);
  }
  async editFirmByAdmin(@Session() session:{token?:string}, firmID:number, eik:string, email:string, phoneNumber:string, address:string, city:string)
  {
    const decoded = await this.jwtService.decode(session.token);
    

  }
  async addTaxiDriverByAdmin(@Session() session:{token?:string}, firmID:number, userID:number)
  {
    const firm = await this.firmRepository.findOne({id: firmID});
    const user = await this.userRepository.findOne({id:userID});
    if(firm)
    {
      this.firmRepository.addTaxiDriver(firm.eik, user);
    }
  }
  async getAllCities()
  {
    return await this.cityRepository.getAllCities();
  }
  async getAllFirms()
  {
    return await this.firmRepository.getAllFirms()
  }
}
