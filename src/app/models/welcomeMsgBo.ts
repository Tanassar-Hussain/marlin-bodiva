export class WelcomeMg {
    participantId: number;
    participantName: string;
    participantCode: string;
    welcomeMsg: string;
    active: boolean;
    welcomeMsgId: number
    languageId: number


    constructor() {
        this.participantId = 0;
        this.participantName = '';
        this.participantCode = '';
        this.welcomeMsg = '';
        this.active = false;
        this.welcomeMsgId = 0;
        this.languageId = 1;

    }
}