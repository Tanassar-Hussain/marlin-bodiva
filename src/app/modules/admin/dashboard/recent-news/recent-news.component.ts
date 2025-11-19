import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseNavigationItem } from '@fuse/components/navigation/navigation.types';
import { Router } from "@angular/router";
import { AppInjector } from "../../../../app.module";
import { NewsAdvertisementService } from '../../news_advertisements/news_advertisements.service';
import { DomSanitizer } from '@angular/platform-browser';
import { DashboardService } from '../dashboard.service';
import * as xml2js from 'xml2js';
import { BehaviorSubject, Subject } from 'rxjs';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { AppConstants } from 'app/app.utility';
import { error } from 'jquery';

@Component({
    selector: 'recent-news',
    templateUrl: './recent-news.component.html',
    styleUrls: ['./recent-news.component.scss'],

    encapsulation: ViewEncapsulation.None,
})
export class RecentNewsComponent implements OnInit {
    menuData: FuseNavigationItem[];
    naActiveDate: []
    rssData: string;
    rssTitle: string;
    rssFilterData$ = new BehaviorSubject<object>([]);
    rssFilterData: object[] = [];
    reutersFeed: any;
    size: number
    hasMore: boolean = true
    lang: string;
    hasNews: boolean = false
    rssURL: any;
    constructor(
        private news_advertisement_Service: NewsAdvertisementService,
        private dashboard_Service: DashboardService,
        private sanitizer: DomSanitizer,
        private loader: FuseLoaderScreenService,
        private toast: ToastrService,
        private translate: TranslateService
    ) {
        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngxtranslate__________________________________________
    }

    ngOnInit() {
        this.size = AppConstants.NEWS_LIST_SIZE;
        this.rssURL = AppConstants.RSS_URL;
       // this.getRssData('/api');  //url is present in proxy.conf.json to remove CORS error.
        // Credit:Usama Attique
        this.getRssData(this.rssURL); 
     // this.getRssDataNew('/api'); 
 


    }

    openLink(link) {
        window.open(link);
    }

    // getRssData(url) {
    //     this.loader.show()
    //     this.dashboard_Service.getRssFeed(url)
    //         .subscribe(res => {

    //             this.loader.hide()
    //             const parser = new xml2js.Parser({ strict: false, trim: true });
    //             parser.parseString(res, (err, result) => {
    //                 let data: object[]

    //                 this.rssTitle = result.RSS.CHANNEL[0].TITLE
    //                 let regex = /<p[^>]*>(?!.*<p[^>]*>)(.*)<\/p>/s;

    //                 result.RSS.CHANNEL[0].ITEM.map(res => {
    //                     data = res
    //                     res.DESCRIPTION = res.DESCRIPTION[0].replace(regex, '')
    //                     this.rssFilterData.push(data)
    //                 })

    //                 this.rssFilterData$.next(this.rssFilterData.slice(0, this.size))
    //                 if (this.rssFilterData.length > this.size) {
    //                     this.hasNews = true
    //                 }
    //             })
    //         }, (error => {

    //             this.loader.hide()
    //             this.toast.error('Recent News Not Found', 'Error')
    //         }))
    // }







    getRssData(url) {
        this.loader.show()
        this.dashboard_Service.getRssFeed(url)
            .subscribe(res => {
                    
                this.loader.hide()
                const parser = new xml2js.Parser({ strict: false, trim: true });
                parser.parseString(res, (err, result) => {
                    let data: object[]
                    let size = 5

                    this.rssTitle = result.RSS.CHANNEL[0].TITLE
                    for (let i = 0; i <= 29; i++) {
                        if (result.RSS.CHANNEL[0].ITEM[i].CATEGORY == "Markets" || result.RSS.CHANNEL[0].ITEM[i].CATEGORY == "Business & Finance") {
                            data = result.RSS.CHANNEL[0].ITEM[i];
                            this.rssFilterData.push(data);
                        }
                    }
                    this.rssFilterData$.next(this.rssFilterData.slice(0, this.size));
                    if (this.rssFilterData.length > this.size) {
                        this.hasNews = true;
                    }
                })
            }, (error => {
                this.loader.hide();
               // this.toast.error('Recent News Not Found', 'Error');
            }))
    }



    // getRssDataNew(url) {
    //     this.loader.show();
        
    //     this.dashboard_Service.getRssFeed(url)
    //         .subscribe(res => {
    //           
    //               let rssFeed;
    //               const parser = new xml2js.Parser({ strict: false, trim: true });
    //               parser.parseString(res, (err, result) => {
    //                 rssFeed = result;
    //                 let data: object[]
    //                 let size = 5

    //                 this.rssTitle = result.RSS.CHANNEL[0].TITLE

    //                 for (let i = 0; i <= 10; i++) {
    //                 //    if (result.RSS.CHANNEL[0].ITEM[i].CATEGORY == "Markets" || result.RSS.CHANNEL[0].ITEM[i].CATEGORY == "Business & Finance") {
    //                         data = result.RSS.CHANNEL[0].ITEM[i];
    //                         this.rssFilterData.push(data);
    //                 //    }
    //                 }
    //                 this.rssFilterData$.next(this.rssFilterData.slice(0, this.size));
    //                 if (this.rssFilterData.length > this.size) {
    //                     this.hasNews = true;
    //                 }



    //               });
    //              // return rssFeed;
    //             },(error => {
    //                 this.loader.hide();
    //                // this.toast.error('Recent News Not Found', 'Error');
    //             }));
    //         }
    



 


    showMore() {
        this.size = this.rssFilterData.length;
        this.hasMore = false;

        this.rssFilterData$.next(this.rssFilterData.slice(0, this.size))
    }

    showLess() {
        this.size = AppConstants.NEWS_LIST_SIZE;
        if (this.size < this.rssFilterData.length)
            this.hasMore = true;

        this.rssFilterData$.next(this.rssFilterData.slice(0, this.size))
    }

}

