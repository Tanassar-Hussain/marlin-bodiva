import {Injectable} from '@angular/core';
import { AppConstants, AppUtility } from 'app/app.utility';
import { environment } from 'environments/environment';
import {Socket} from "ngx-socket-io";
import { Observable, Subject, Subscriber } from 'rxjs';
import {map} from "rxjs/operators";
import { io } from 'socket.io-client';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {

    private isConnected = new Subject<boolean>();
    
    public  socketToken = "a||-5Jh>R(I&`4Xf42vz=Z]Dtze{@#4}5?}YJ*VC>,bc?,JNVg;#UlJ+Fk.n>~+";
    socketIO : any

    constructor(private socket: Socket) {
       this.socketIO = io(environment.socketUrl);

       this.createConnection();


    }


   createConnection=()=>{   
    this.socketIO.emit('authenticate', { token: this.socketToken }) .on('authenticated', (data) => {
       setInterval(()=>{
        if(AppUtility.isValidVariable(data)){
          this.setConnectionStatus(data.isConnected);
          // this.fetchFromChannel('order_confirmation' , {'user' : AppConstants.username});
          // this.fetchFromChannel('alert' , {'user' : AppConstants.username});
        }else{
          this.setConnectionStatus(false);
        }
       }, 5000)
        this.fetchFromChannel('order_confirmation' , {'user' : AppConstants.username});
        this.fetchFromChannel('alert' , {'user' : AppConstants.username});
       })
      .on('unauthorized', (error) => {
        this.setConnectionStatus(false);
        console.log('unauthorized on push server From WebSocket Service: ' + JSON.stringify(error.data));
      });
      
   }




    onFetchDataFromChannel(_channelName : string) {
        return new Observable((subscriber) => {
            this.socketIO.on(_channelName , (data)=>{
                 subscriber.next(data);
            })
        });
    }



    fetchFromChannel(_channelName: string , obj) {
      
            this.socketIO.emit(_channelName, obj);
    }


    
    
    public setConnectionStatus(status: boolean): void {
        this.isConnected.next(status);
      }

      public getConnectionStatus(): Observable<boolean> {
        return this.isConnected.asObservable();
      }



}
