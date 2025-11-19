import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    ViewEncapsulation
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FuseMediaWatcherService } from "@fuse/services/media-watcher";
import { UserService } from 'app/core/user/user.service';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { AppState } from 'app/app.service';
import { ListingService } from 'app/services/listing.service';
import { AppConstants, AppUtility } from 'app/app.utility';
import { TranslocoService } from '@ngneat/transloco';
import { MatDialog } from '@angular/material/dialog';
import { WelcomeComponent } from 'app/modules/auth/welcome-note/welcome-note';
@Component({
    selector: 'finance',
    templateUrl: './dashboard.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    public investorProfileStatus: String = "";
    userType: string;
    currentLang: string = null;
    langs = this.transloco.getAvailableLangs();
    activelang = this.transloco.getActiveLang();

    constructor(private _fuseMediaWatcherService: FuseMediaWatcherService, private userService: UserService,
        private splash: FuseLoaderScreenService, private appState: AppState, private listingService: ListingService, private transloco: TranslocoService, private _matDialog: MatDialog) {
        this.userService.selectedOC$.subscribe((value) => {
            if (this.drawerOpened === true) {
                this.drawerOpened = false;
            }
            else {
                this.drawerOpened = true;
            }
        });

        this.userType = AppConstants.userType;

        this.currentLang = localStorage.getItem("lang")
        if (this.currentLang != null) {
            this.transloco.setActiveLang(this.currentLang)
            this.activelang = this.transloco.getActiveLang();
        }




    }

    ngOnInit(): void {

        this.splash.hide();
        this.getUserProfileStatus();
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                matchingAliases.includes('md') ? this.drawerMode = 'side' : this.drawerMode = 'over';
            });

        this.appState.showLoader = false;

        if (AppConstants.userType === 'CLIENT' && AppConstants.participantId != null && AppConstants.loginCount === 0) {
            this.welcomeMsgForNewClinet()
        }
    }





    public getUserProfileStatus = () => {

        this.listingService.getInvestorProfileStatus(AppConstants.userId).subscribe((restData: any) => {

            if (!AppUtility.isEmptyArray(restData)) {

                this.investorProfileStatus = restData[0].statusCode;
            }
            else {
                this.investorProfileStatus = "";
            }
        }, error => {

            console.log(error);
        })
    }

    welcomeMsgForNewClinet() {
        this._matDialog.open(WelcomeComponent, {
            autoFocus: false,
            position: { top: '4%' },
            panelClass: 'welcomeNote'
        }).afterClosed().subscribe((data) => {
        })
    }


}
