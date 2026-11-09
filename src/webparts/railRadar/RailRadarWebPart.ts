import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { SharePointStore } from './SharePointStore';
import { RailApp } from './RailApp';
export interface IRailRadarWebPartProps { listName:string; readonlyMode:boolean; }
export default class RailRadarWebPart extends BaseClientSideWebPart<IRailRadarWebPartProps> {
 private app:RailApp|undefined;
 public render():void {if(this.app)this.app.dispose();const name=(this.properties.listName||'Technologieradar Rail').trim();this.app=new RailApp(this.domElement,new SharePointStore(this.context.spHttpClient,this.context.pageContext.web.absoluteUrl,name),!!this.properties.readonlyMode,name);}
 protected onDispose():void {this.app?.dispose();}
 protected get dataVersion():Version{return Version.parse('1.0');}
 protected getPropertyPaneConfiguration():IPropertyPaneConfiguration{return {pages:[{header:{description:'Daten werden in einer Liste auf dieser Website gespeichert. Für die Einrichtung werden Listenverwaltungsrechte benötigt.'},groups:[{groupName:'Technologieradar Rail',groupFields:[PropertyPaneTextField('listName',{label:'Listenname',description:'Standard: Technologieradar Rail. Bei Änderung wird eine andere Liste verwendet.'}),PropertyPaneToggle('readonlyMode',{label:'Nur Anzeige',onText:'Bearbeitung ausgeblendet',offText:'Bearbeitung möglich gemäß Listenrechten'})]}]}]};}
}
