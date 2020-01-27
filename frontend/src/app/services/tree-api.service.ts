import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DbNode {
  id: number;
  parentId: number | null;
  name: string;
  isRemoved: boolean;
  children: Array<DbNode>;
}

export interface NodeToInsert {
  id: number;
  parentId: number | null;
  name: string;
  children: Array<this>;
}

export interface ChangeModel {
  nodesToRemove?: Array<number>;
  nodesToInsert?: Array<NodeToInsert>;
  nodesToUpdate?: {
    [key: number]: string;
  };
}

@Injectable({ providedIn: 'root' })
export class TreeBackendApi {

  // private readonly _baseUrl = '/api/tree';
  private readonly _baseUrl = 'http://localhost:5000/tree';

  constructor(private _http: HttpClient) {}

  getRoot(): Observable<DbNode> {
    return this._http.get<DbNode>(this._baseUrl);
  }

  getNodeById(id: number): Observable<DbNode> {
    return this._http.get<DbNode>(`${this._baseUrl}/${id}`);
  }

  reset(): Observable<any> {
    return this._http.post(`${this._baseUrl}/reset`, null);
  }

  applyChanges(changeModel: ChangeModel): Observable<any> {
    return this._http.put(`${this._baseUrl}`, changeModel);
  }
}
