import { Route } from '@angular/router';
import { WelcomeComponent } from 'app/modules/auth/welcome-note/welcome-note';
import { DashboardComponent } from "./dashboard.component";
import { DashboardResolvers } from "./dashboard.resolvers";

export const dashboardRoutes: Route[] = [
    {
        path: '',
        component: DashboardComponent,
        resolve: {
            data: DashboardResolvers
        }

    },
    {
        path: 'welcome-note',
        component:WelcomeComponent,
    },
];
