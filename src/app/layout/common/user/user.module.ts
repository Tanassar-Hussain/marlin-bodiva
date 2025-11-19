import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { UserComponent } from 'app/layout/common/user/user.component';
import { SharedModule } from 'app/shared/shared.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslocoRootModule } from 'app/transloco/transloco-root.module';
import { WjInputModule } from '@grapecity/wijmo.angular2.input';
@NgModule({
    declarations: [
        UserComponent,
    ],
    imports: [
        MatButtonModule,
        MatDividerModule,
        MatIconModule,
        MatMenuModule,
        SharedModule,
        MatExpansionModule,
        TranslocoRootModule,
        WjInputModule,
        
    ],
    exports: [
        UserComponent
    ]
})
export class UserModule {
}
