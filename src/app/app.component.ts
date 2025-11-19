import {Component, ViewChild} from '@angular/core';
import { Router } from '@angular/router';
import * as wjcCore from '@grapecity/wijmo';
import { UserIdleService } from 'angular-user-idle';
import { AppState } from './app.service';
import { AppConstants, AppUtility } from './app.utility';
 
 
wjcCore.setLicenseKey('192.168.36.141|202.59.76.218|192.168.36.103|192.168.36.45|192.168.36.186|bbo.esx.et|192.168.36.242|192.168.36.247|192.168.36.177|102.37.222.234|192.168.36.185|192.168.36.236|192.168.36.126|40.67.224.72|trading.mse.co.mw|bbo.esxethiopia.com|go.marlinpro.com|172.10.10.10|192.168.36.10|staging.bbo.esxethiopia.com|psx.marlinpro.com|marlinpro.net|192.168.36.82|192.168.36.226|192.168.36.245|10.11.2.3|192.168.36.117|192.168.36.121|196.190.251.118|bbostaging.esxethiopia.com|196.11.85.50|192.168.36.222|196.11.80.176|10.11.2.10|192.168.36.51|102.37.18.135|192.168.36.15|192.168.36.105|192.168.36.61,932953992636939#B0HZgJHdsIzNuQjMy8yN68CM4wiNyEjL6MjL8YTMuITOxwiNzIjL6MjL8YTMuITOxwSN8EjL6MjL8YTMuITOxwCNzIjLyIjMuczMuIDMxwyN7EjL6MjL8YTMuITOxwyN4IjL6MjL8YTMuITOxwiM4IjL6MjL8YTMuITOxwCdl9CezVmLvJmYsYDOx8iNz8CO6EjLykTMsUDNuYzMugjNx8iM9EDLzATMuYzMugjNx8iM9EDL8EjMuYzNukTNuIDMywSM4EjL6MjL8YTMuITOxIiOiMXbEJCLig6YlR7bm9WSiojIh94QiwiI9MTO6MjNykTOzUTOyMTOiojIklkIs4XXbpjInxmZiwiIxYnMyAjMiojIyVmdiwSZzxWYmpjIyNHZisnOiwmbBJye0ICRiwiI34TQWV6as3EcqJ6KDNlQ4NXSaV4LRRzLL96L4MnRwVXVZ5UWZNTN7oUNQxkNjVncD3UeDd4Vzs6NHJDdy2WZBdlNzpGMHhzSwZ6NUVkRn5kSpZza6UEdyUWMEtiVnFTVVZEbEVGVXNzY4dEdzgUbY3GOEFWdDJ4YZN4dXZDN9REWzlmRvUlThpUWqBHM5IGazUjcGVFTy2WY9pFZvImMkNFNiNEN5wUWCp7ZTd5QRVFVyFzdmBjV4lkeqBnaMxGboZXVsdEUVRUc8YneaVUQlVXSsNkSjJkcP3WVtRjcr96LvpHO7I6aywWb4c6c7I6R6cGVUJzNw9EWyIXWrllTr2COXFEeuNTetZ4Lzl7Mqd7bhh5Q6dkS8QFTqJFR5dUbV5WV7V5KtNkUHpXQUZVMBBHOK9ENwM6Vy3yK4VEZyQlS53GMWJGW6ZlZpdDcN9mRpFTeqtkSGFmI0IyUiwiI6QkRGNTNzYjI0ICSiwSOzIjMzUDM5ATM0IicfJye35XX3JSSwIjUiojIDJCLi86bpNnblRHeFBCI4VWZoNFelxmRg2Wbql6ViojIOJyes4nI5kkTRJiOiMkIsIibvl6cuVGd8VEIgIXZ7VWaWRncvBXZSBybtpWaXJiOi8kI1xSfis4N8gkI0IyQiwiIu3Waz9WZ4hXRgAydvJVa4xWdNBybtpWaXJiOi8kI1xSfiQjR6QkI0IyQiwiIu3Waz9WZ4hXRgACUBx4TgAybtpWaXJiOi8kI1xSfiMzQwIkI0IyQiwiIlJ7bDBybtpWaXJiOi8kI1xSfiUFO7EkI0IyQiwiIu3Waz9WZ4hXRgACdyFGaDxWYpNmbh9WaGBybtpWaXJiOi8kI1tlOiQmcQJCLikTM7IzNwACMzcDM5IDMyIiOiQncDJCLiEjNuYzMugjNx8iM9EDL5ATMuYzMugjNx8iM9EDL5EjL6MjL8YTMuITOxwSNzEjL8EjL7MjLyATMsETNuYzMugjNx8iM9EDLwEjLy8SMx8CMxwiN7EjLwgjLxEjL6kTMsIjMy8iNz8CO6EjLykTMsATNuUDOuETMuYTOxwSbvNmLhlGcvlGa4VGezVmLn9WanFGdz3mYixCOxEjLxUjMuATOx8iN9EDLxITMuYzMugjNx8iM9EDL7ETMuYzMugjNx8iM9EDLz8iMuETMuATMsUDNy8iNz8CO6EjLykTMsYjMy8iNz8CO6EjLykTMsIDOuYzMugjNx8iM9EDL4Vmbu2mcw9WasJXYtxSbvNmLvJHculGbyFWbug7cwxSbvNmLhlGcvlGa4VGezVmLvJmYucmbpdWY4NHLwEjL6MjL8YTMuITOxwCMx8CMx8CMx8iM7EDLt36Yu2mcw9WasJXYt9ybnxSbvNmLhlGcvlGa4VGezVmLvJmYscXbu26YuU6ct9UZYl');


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],

})
export class AppComponent {

 


    constructor(public appState: AppState, public userIdle : UserIdleService, public _router : Router) {

        let token = sessionStorage.getItem('token');
        if(AppUtility.isValidVariable(token)){
            this.userIdle.startWatching();

         /************************************* */
        ///////////Session Timeout /////////////
        /*********************************** */
        //  // Start watching when user idle is starting.
        this.userIdle.onTimerStart().subscribe((count) => console.log(count));

        // Start watch when time is up.
        this.userIdle.onTimeout().subscribe(() => {
            this.userIdle.stopTimer();
            this.userIdle.stopWatching();
            this.onTimeout();
        });
        /************************************** */
        /////////// Session Timeout /////////////
        /************************************ */


        }


         /****************************************************** */
        ///////////UTC Time Hours Set on Refresh Page/////////////
        /***************************************************** */
        let utcHours = sessionStorage.getItem('utchours');
        if(AppUtility.isValidVariable(utcHours)){
            AppConstants.UTC_LOCALE_HOURS = utcHours;
        }
       /****************************************************** */
        ///////////UTC Time Hours Set on Refresh Page/////////////
        /***************************************************** */
        
     /****************************************************** */
        ///////////Broker Code Set on Refresh Page/////////////
        /***************************************************** */
        let brokerCode = sessionStorage.getItem('brokerCode');
        if(AppUtility.isValidVariable(brokerCode) && brokerCode !== ""){
            AppConstants.BROKER_CODE_SIGN_IN = brokerCode;
        }
       /****************************************************** */
        /////////////Broker Code Set on Refresh Page/////////////
        /***************************************************** */




    }



  





    public onTimeout = () => {
        this._router.navigate(['/sign-in']);
         
        localStorage.removeItem('MarlinToken');
        localStorage.removeItem('user');

        sessionStorage.removeItem('token');
        sessionStorage.removeItem('MarlinToken');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('tradeType');
        sessionStorage.removeItem('exchangeId');
        let a = sessionStorage.getItem('brokerCode');
        if(AppUtility.isValidVariable(a)){
            AppConstants.BROKER_CODE_SIGN_IN = a;
        }

      
    }

 

    


}
