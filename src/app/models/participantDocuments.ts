import { AppConstants } from "app/app.utility";

export class ParticipantDocuments {

    participantDocumentId: Number = null;
    documentBase64_: string = ""; // logo file address.
    contentType : String = "";
    documentName: String = "";
    documentTypeId: Number = 10;   //10 id is for T&C Document
    langId : Number = null;
    participantId : Number = AppConstants.participantId;
}