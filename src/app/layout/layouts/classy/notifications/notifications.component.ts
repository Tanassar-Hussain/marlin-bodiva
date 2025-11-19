import { state } from '@angular/animations';
import { Component, ElementRef, OnInit, AfterViewInit, Input } from '@angular/core';

import * as wjcCore from '@grapecity/wijmo';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from 'app/app.config';
import { AppUtility } from 'app/app.utility';
// import { AuthService } from 'app/core/auth/auth.service';
import { ShareOrderService } from 'app/modules/admin/oms/order/order.service';
import { AuthService } from 'app/services-oms/auth-oms.service';

import { Notification } from './notification';
declare var jQuery: any;

/////////////////////////////////////////////////////////////////////////////

@Component({
  selector: '[notifications]',
  templateUrl: './notifications.template.html'
})
export class Notifications implements OnInit, AfterViewInit {
  $el: any;
  config: any;
  lang: any
  userFromSession: any;
  toDate: string = ''
  @Input('type') type: number;

  //  notificationType: number = 0;
  messages: Array<Notification> = new Array<Notification>();
  alerts: Array<Notification> = new Array<Notification>();
  announcements: Array<Notification> = new Array<Notification>();

  // --------------------------------------------------------------------

  constructor(el: ElementRef, config: AppConfig, private authService: AuthService, private translate: TranslateService, public shareOrderService: ShareOrderService) {
    this.$el = jQuery(el.nativeElement);
    this.config = config;
    this.userFromSession = JSON.parse(sessionStorage.getItem('user'));
    //_______________________________for ngx_translate_________________________________________

    this.lang = localStorage.getItem("lang");
    if (this.lang == null) { this.lang = 'en' }
    this.translate.use(this.lang)
    //______________________________for ngx_translate__________________________________________
  }

  // --------------------------------------------------------------------

  ngOnInit(): void {


    this.getMessages();

    this.authService.socket.on('market_state', (data) => {
      


      let notifiation: Notification = new Notification();

      notifiation.content = this.formatMarketState(data);
      notifiation.type = data.state;
      this.messages.unshift(notifiation);

    });




    if (0 === this.type) {

      this.authService.socket.on('order_confirmation', (data) => {
        if (data.state !== 'filled' && data.state !== 'partial_filled') {
          let notifiation: Notification = new Notification();

          let m = this.formatConfirmation(data);
          notifiation.content = m.message;
          notifiation.type = m.state;
          this.messages.unshift(notifiation);
        }
      });
    }

    if (1 === this.type) {


      this.authService.socket.on('alert', (data) => {
        
        let notifiation: Notification = new Notification();
        notifiation.content = this.formatAlert(data);
        this.alerts.unshift(notifiation);
      });
    }

    if (2 === this.type) {
      this.authService.socket.on('announcement', (data) => {
        let notifiation: Notification = new Notification();
        notifiation.content = this.formatAnnouncement(data);
        this.announcements.unshift(notifiation);
      });
    }



  }

  // --------------------------------------------------------------------

  ngAfterViewInit() {
    this.config.onScreenSize(['sm', 'xs'], this.moveNotificationsDropdown);
    this.config.onScreenSize(['sm', 'xs'], this.moveBackNotificationsDropdown, false);

    if (this.config.isScreen('sm')) { this.moveNotificationsDropdown(); }
    if (this.config.isScreen('xs')) { this.moveNotificationsDropdown(); }

    jQuery('.sidebar-status').on('show.bs.dropdown', () => {
      jQuery('#sidebar').css('z-index', 2);
    }).on('hidden.bs.dropdown', () => {
      jQuery('#sidebar').css('z-index', '');
    });

    jQuery(document).on('change', '[data-toggle="buttons"] > label', ($event) => {
      let $input = jQuery($event.target).find('input');
      $input.trigger('change');
    });



  }


  // --------------------------------------------------------------------

  formatMarketState(data): string {
    if (this.lang === 'en') {
      return 'Market State of ' + data.market + ' in ' + data.exchange + " is " + data.state;
    }
    else {
      return 'Estado do mercado de ' + data.market + ' em ' + data.exchange + " é " + data.state;
    }

  }

  // --------------------------------------------------------------------

  // --------------------------------------------------------------------

  formatAnnouncement(data): string {
    if (this.lang === 'en') {
      return 'Security: ' + data.symbol + ', Message: ' + data.message;
    }
    else {
      return 'Segurança: ' + data.symbol + ', Mensagem: ' + data.message;
    }

  }

  // --------------------------------------------------------------------

  formatAlert(data): string {
    if (this.lang === 'en') {
      return 'Expression: ' + data.expression + ', Message: ' + data.message + ', Name: ' + data.name;
    }
    else {
      return 'Expressão: ' + data.expression + ', Mensagem: ' + data.message + ', Nome: ' + data.name;
    }

  }

  // --------------------------------------------------------------------

  formatConfirmation(data): any {
    let orderState: string = '';
    let orderConfirmMsg: string = '';
    let price: string = '';
    let volume: string = '';
    // ...............................................................................

    let rejectionMsg: string = data.rejection_message
    let side: string = data.side
    let OrderSubmitted = "Encomenda Submetida: "
    let OrderChanged = "Pedido Alterado: "
    let OrderCancelled = "Pedido Cancelado: "
    let OrderReceived = "Pedido Recebido: "
    let OrderPurged = "Pedido Removido: "
    let OrderRejected = "Pedido Rejeitado: "
    let OrderTraded = "Pedido Negociado: "
    let OrderPending = "Pedido Pendente"
    let in_ = "dentro"
    let of_ = "do"


    if (this.lang == "pt") {
      if (rejectionMsg == "The specified market is not in valid state to place orders.")
        rejectionMsg = "O mercado especificado não está em estado válido para fazer pedidos."
      if (side == "buy")
        side = "comprar"
      if (side == "sell")
        side = "vender"
    }


    // ...............................................................................

    if (!('symbol' in data)) {
      orderConfirmMsg = data.rejection_message;
    }
    else {
      price = (data.price > 0) ? wjcCore.Globalize.formatNumber(Number(data.price), 'n4') : 'Market';
      volume = wjcCore.Globalize.formatNumber(Number(data.volume), 'n0');

      orderConfirmMsg = '';
      orderState = '';
      if (data.state === 'submitted') {
        if (this.lang == "en") {
          orderConfirmMsg = 'Order Submitted: ' + AppUtility.ucFirstLetter(data.side) + ' ' + data.symbol + ' ' + volume + ' @ ' +
            price + ', Order No. ' + data.order_no + ' in ' + data.market + ' of ' + data.exchange;
          orderState = 'submitted' + '_' + AppUtility.ucFirstLetter(data.side);
        }
        else if (this.lang == "pt") {
          orderConfirmMsg = OrderSubmitted + AppUtility.ucFirstLetter(side) + ' ' + data.symbol + ' ' + volume + ' @ ' +
            price + ', Order No. ' + data.order_no + ' dentro ' + data.market + ' do ' + data.exchange;
          orderState = 'submitted' + '_' + AppUtility.ucFirstLetter(data.side);
        }
      }
      else if (data.state === 'changed') {
        if (this.lang == "en") {
          orderConfirmMsg = 'Order Changed: ' + AppUtility.ucFirstLetter(data.side) + ' ' + data.symbol + ' ' + volume + ' @ ' +
            price + ', Order No. ' + data.order_no + ' in ' + data.market + ' of ' + data.exchange;
          orderState = 'changed' + '_' + AppUtility.ucFirstLetter(data.side);
        }
        else if (this.lang == "pt") {
          orderConfirmMsg = OrderChanged + AppUtility.ucFirstLetter(side) + ' ' + data.symbol + ' ' + volume + ' @ ' +
            price + ', Order No. ' + data.order_no + ' dentro ' + data.market + ' do ' + data.exchange;
          orderState = 'changed' + '_' + AppUtility.ucFirstLetter(data.side);
        }
      }
      else if (data.state === 'cancelled') {
        if (this.lang == "en") {
          orderConfirmMsg = 'Order Cancelled: ' + AppUtility.ucFirstLetter(data.side) + ' ' + data.symbol + ' ' + volume + ' @ ' +
            price + ', Order No. ' + data.order_no + ' in ' + data.market + ' of ' + data.exchange;
          orderState = 'cancelled' + '_' + AppUtility.ucFirstLetter(data.side);
        }
        else if (this.lang == "pt") {
          orderConfirmMsg = OrderCancelled + AppUtility.ucFirstLetter(side) + ' ' + data.symbol + ' ' + volume + ' @ ' +
            price + ', Order No. ' + data.order_no + ' dentro ' + data.market + ' do ' + data.exchange;
          orderState = 'cancelled' + '_' + AppUtility.ucFirstLetter(data.side);
        }
      }
      else if (data.state === 'received') {
        if (this.lang == "en") {
          orderConfirmMsg = 'Order Received: ' + AppUtility.ucFirstLetter(data.side) + ' ' + data.symbol + ' ' + volume + ' @ ' +
            price + ', Order No. ' + data.order_no + ' in ' + data.market + ' of ' + data.exchange;
          orderState = 'received' + '_' + AppUtility.ucFirstLetter(data.side);
        }
        else if (this.lang == "pt") {
          orderConfirmMsg = OrderReceived + AppUtility.ucFirstLetter(side) + ' ' + data.symbol + ' ' + volume + ' @ ' +
            price + ', Order No. ' + data.order_no + ' dentro ' + data.market + ' do ' + data.exchange;
          orderState = 'received' + '_' + AppUtility.ucFirstLetter(data.side);
        }
      }
      else if (data.state === 'purged') {
        if (this.lang == "en") {
          orderConfirmMsg = 'Order Purged: ' + AppUtility.ucFirstLetter(data.side) + ' ' + data.symbol + ' ' + volume + ' @ ' +
            price + ', Order No. ' + data.order_no + ' in ' + data.market + ' of ' + data.exchange;
          orderState = 'purged' + '_' + AppUtility.ucFirstLetter(data.side);

        }
        else if (this.lang == "pt") {
          orderConfirmMsg = OrderPurged + AppUtility.ucFirstLetter(side) + ' ' + data.symbol + ' ' + volume + ' @ ' +
            price + ', Order No. ' + data.order_no + ' dentro ' + data.market + ' do ' + data.exchange;
          orderState = 'purged' + '_' + AppUtility.ucFirstLetter(data.side);
        }
      }
      else if (data.state === "pending") {
        if (this.lang == "en") {
          orderConfirmMsg = 'Order Pending: ' + AppUtility.ucFirstLetter(data.side) + ' ' + data.symbol + ' ' + volume + ' @ ' +
            price + ' in ' + data.market + ' of ' + data.exchange + ', ' + data.rejection_message;
          orderState = 'pending' + '_' + AppUtility.ucFirstLetter(data.side);

        }
        else if (this.lang == "pt") {
          orderConfirmMsg = OrderPending + AppUtility.ucFirstLetter(side) + ' ' + data.symbol + ' ' + volume + ' @ ' +
            price + ' dentro ' + data.market + ' do ' + data.exchange + ', ' + rejectionMsg;
          orderState = 'pending' + '_' + AppUtility.ucFirstLetter(data.side);
        }
      }
      else if (data.state === 'rejected') {
        if (this.lang == "en") {
          orderConfirmMsg = 'Order Rejected: ' + AppUtility.ucFirstLetter(data.side) + ' ' + data.symbol + ' ' + volume + ' @ ' +
            price + ' in ' + data.market + ' of ' + data.exchange + ', ' + data.rejection_message;
          orderState = 'rejected' + '_' + AppUtility.ucFirstLetter(data.side);

        }
        else if (this.lang == "pt") {
          orderConfirmMsg = OrderRejected + AppUtility.ucFirstLetter(side) + ' ' + data.symbol + ' ' + volume + ' @ ' +
            price + ' dentro ' + data.market + ' do ' + data.exchange + ', ' + rejectionMsg;
          orderState = 'rejected' + '_' + AppUtility.ucFirstLetter(data.side);
        }
      }
      // else if (data.state === 'filled') {
      //   orderConfirmMsg = 'Order Filled: ' + ', Order No. ' + data.order_no + ' in ' + data.market + ' of ' + data.exchange;
      // }
      else if (data.state === 'trade') {
        if (this.lang == "en") {
          orderConfirmMsg = 'Order Traded: ' + AppUtility.ucFirstLetter(data.side) + ' ' + data.symbol + ' ' + volume + ' @ ' +
            price + ', Remaining Volume ' + data.remaining_volume + ', Ticket No. ' + data.ticket_no + ' in ' + data.market + ' of ' + data.exchange;
          orderState = 'trade' + '_' + AppUtility.ucFirstLetter(data.side);
        }
        else if (this.lang == "pt") {
          orderConfirmMsg = OrderTraded + AppUtility.ucFirstLetter(side) + ' ' + data.symbol + ' ' + volume + ' @ ' +
            price + ', Volume Restante ' + data.remaining_volume + ', Número do Bilhete. ' + data.ticket_no + ' dentro ' + data.market + ' do ' + data.exchange;
          orderState = 'trade' + '_' + AppUtility.ucFirstLetter(data.side);
        }
      }
      // else if (data.state === 'partial_filled') {
      //   orderConfirmMsg = 'Order Partial Traded: ' + 'Remaining Volume ' + volume + ', Order No. ' + data.order_no + ' in ' + data.market + ' of ' + data.exchange;
      // }
    }


    return { 'message': orderConfirmMsg, 'state': orderState };

  }

  // --------------------------------------------------------------------

  moveNotificationsDropdown(): void {
    jQuery('.sidebar-status .dropdown-toggle').after(jQuery('[notifications]').detach());
  }

  // --------------------------------------------------------------------

  moveBackNotificationsDropdown(): void {
    jQuery('#notifications-dropdown-toggle').after(jQuery('[notifications]').detach());
  }

  getMessages() {

    this.toDate = AppUtility.formatDate_YYYY_MM_DD(new Date)
    let reqData = {
      date: this.toDate,
      userId: this.userFromSession.Id
    }
    this.authService.getMessages(reqData).subscribe(res => {
      if (AppUtility.isValidVariable(res)) {
        res.map(a => {
          if (a.state !== 'Fill' && a.state !== 'PartialFill') {
            a.order_no = a.orderNo;
            a.ref_no = a.refNo.toString();
            a.remaining_volume = a.remainingVolume;
            a.ticket_no = a.ticketNo;
            // a.price = a.price
            // a.volume = a.volume
            // a.yield = a.yield
            // a.timestamp = a.timestamp;

            // ...............................................checking state.................................
            if (a.state == 'Submit') {
              a.state = 'submitted'
            }
            else if (a.state == 'Change') {
              a.state = 'changed'
            }
            else if (a.state == 'Cancel') {
              a.state = 'cancelled'
            }
            else if (a.state == 'Received') {
              a.state = 'received'
            }
            else if (a.state == 'Purge') {
              a.state = 'purged'
            }
            else if (a.state == '') {
              a.state = 'pending'
            }
            else if (a.state == 'Reject') {
              a.state = 'rejected'
            }
            else if (a.state == 'Trade') {
              a.state = 'trade'
            }
            // ...............................................checking state.................................

            a.rejection_message = a.rejectionMessage

            let notifiation: Notification = new Notification();
            let m = this.formatConfirmation(a);
            notifiation.content = m.message;
            notifiation.type = m.state;
            notifiation.timestamp = a.timeStamp;
            this.messages.unshift(notifiation);
          }
        })
      }

    }, error => {
    })
  }


}
