import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { Entry, Store, Technology, validate } from './model';
export class SharePointStore implements Store {
 private listId=''; private entity='';
 public constructor(private client: SPHttpClient,private webUrl:string,private title:string){}
 private async request(path:string,method='GET',data?:unknown,etag?:string):Promise<{body:any;response:SPHttpClientResponse}> { // REST payloads use SharePoint metadata
  const headers:Record<string,string>={'Accept':'application/json;odata=verbose','OData-Version':''};
  if(data)headers['Content-Type']='application/json;odata=verbose';
  if(etag){headers['IF-MATCH']=etag;headers['X-HTTP-Method']='MERGE';}
  const url=path.startsWith('https:')?path:this.webUrl+'/_api/'+path;
  if(!url.startsWith(this.webUrl+'/_api/'))throw new Error('Unerwartete SharePoint-Adresse.');
  const response=method==='GET'?await this.client.get(url,SPHttpClient.configurations.v1,{headers}):await this.client.post(url,SPHttpClient.configurations.v1,{headers,body:data?JSON.stringify(data):undefined});
  if(!response.ok){if(response.status===412)throw new Error('Dieser Eintrag wurde inzwischen geändert. Bitte Bearbeitung schließen, aktualisieren und erneut öffnen. Deine Eingaben bleiben bis dahin im Formular.');if(response.status===403)throw new Error('Keine Berechtigung für diese Aktion. Bitte die Listenrechte mit dem Websitebesitzer prüfen.');if(response.status===404)throw new Error('Radarliste nicht gefunden. Bitte Listenname prüfen oder die Liste einrichten.');throw new Error('SharePoint-Anfrage fehlgeschlagen ('+response.status+'). Bitte später erneut versuchen.');}
  const text=await response.text();return {body:text?JSON.parse(text):{},response};
 }
 private byTitle():string {return "web/lists/getbytitle('"+encodeURIComponent(this.title.replace(/'/g,"''"))+"')";}
 private endpoint():string{return "web/lists(guid'"+this.listId+"')";}
 private async connect():Promise<void>{const r=await this.request(this.byTitle()+ '?$select=Id,ListItemEntityTypeFullName,Description');const d=r.body.d;
  if(d.Description!=='Technologieradar Rail data v1')throw new Error('Die Liste existiert, ist aber keine Technologieradar-Rail-Liste. Bitte einen eigenen Listennamen verwenden.');
  this.listId=d.Id;this.entity=d.ListItemEntityTypeFullName;
  const fields=await this.request(this.endpoint()+"/fields?$select=InternalName,TypeAsString&$filter=InternalName eq 'RadarData' or InternalName eq 'TechKey'");
  const f=fields.body.d.results as {InternalName:string;TypeAsString:string}[];
  if(!f.some(x=>x.InternalName==='RadarData'&&x.TypeAsString==='Note')||!f.some(x=>x.InternalName==='TechKey'&&x.TypeAsString==='Text'))throw new Error('Die Einrichtung ist noch nicht vollständig. Bitte „Liste einrichten“ erneut ausführen.');
 }
 public async setup():Promise<void>{
  // First inspect, without interpreting permission/server errors as an absent list.
  const probe=await this.client.get(this.webUrl+'/_api/'+this.byTitle(),SPHttpClient.configurations.v1,{headers:{Accept:'application/json;odata=verbose','OData-Version':''}});
  if(probe.status===404){await this.request('web/lists','POST',{__metadata:{type:'SP.List'},Title:this.title,BaseTemplate:100,Description:'Technologieradar Rail data v1',AllowContentTypes:false,EnableVersioning:true});}
  else if(!probe.ok)throw new Error('Liste kann nicht geprüft werden ('+probe.status+'). Einrichtung benötigt das Recht „Listen verwalten“.');
  const meta=await this.request(this.byTitle());if(meta.body.d.Description!=='Technologieradar Rail data v1')throw new Error('Vorhandene fremde Liste wird nicht verändert. Bitte einen anderen Listennamen wählen.');
  this.listId=meta.body.d.Id;this.entity=meta.body.d.ListItemEntityTypeFullName;
  const fields=await this.request(this.endpoint()+'/fields?$select=InternalName');const existing=(fields.body.d.results as {InternalName:string}[]).map(f=>f.InternalName);
  const specs=[{name:'TechKey',xml:'<Field Type="Text" DisplayName="Technologie ID" Name="TechKey" StaticName="TechKey" Required="TRUE" Indexed="TRUE" EnforceUniqueValues="TRUE" MaxLength="255" />'},{name:'RadarData',xml:'<Field Type="Note" DisplayName="Radardaten" Name="RadarData" StaticName="RadarData" RichText="FALSE" NumLines="6" />'}];
  for(const field of specs)if(existing.indexOf(field.name)<0)await this.request(this.endpoint()+'/fields/createfieldasxml','POST',{parameters:{__metadata:{type:'SP.XmlSchemaFieldCreationInformation'},SchemaXml:field.xml,Options:8}});
  await this.connect();
 }
 public async load():Promise<Entry[]>{await this.connect();let next=this.endpoint()+"/items?$select=Id,Title,TechKey,RadarData&$orderby=Id&$top=500";const result:Entry[]=[];
  while(next){const r=await this.request(next);for(const item of r.body.d.results){try{const data=validate(JSON.parse(item.RadarData));if(data.Id!==item.TechKey)throw new Error('ID stimmt nicht überein');const etag=item.__metadata&&item.__metadata.etag;if(!etag)throw new Error('Versionsinformation fehlt');result.push({data,itemId:item.Id,etag});}catch(e){throw new Error('Listeneintrag '+item.Id+' ist ungültig. Bitte die Daten in der Liste prüfen: '+String(e));}}next=r.body.d.__next||'';}
  return result;
 }
 public async save(raw:Technology,previous?:Entry):Promise<void>{const t=validate(raw);if(!this.listId)await this.connect();const body={__metadata:{type:this.entity},Title:t.Name,TechKey:t.Id,RadarData:JSON.stringify(t)};
  if(previous){if(!previous.etag||previous.data.Id!==t.Id)throw new Error('Ungültige Versionsinformation.');await this.request(this.endpoint()+'/items('+previous.itemId+')','POST',body,previous.etag);}
  else await this.request(this.endpoint()+'/items','POST',body);
 }
}
