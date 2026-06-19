import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client, DashboardData, Invoice, InvoiceStatus } from './models';

const BASE = '/api';

export interface AuthUser { id: string; email: string; name?: string; }
export interface AuthResponse { token: string; user: AuthUser; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // Auth
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${BASE}/auth/login`, { email, password });
  }
  register(email: string, password: string, name: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${BASE}/auth/register`, { email, password, name });
  }
  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${BASE}/auth/me`);
  }

  // Dashboard
  dashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${BASE}/dashboard`);
  }

  // Clients
  clients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${BASE}/clients`);
  }
  client(id: string): Observable<Client> {
    return this.http.get<Client>(`${BASE}/clients/${id}`);
  }
  createClient(body: Partial<Client>): Observable<Client> {
    return this.http.post<Client>(`${BASE}/clients`, body);
  }

  // Invoices
  invoices(status: string = 'all', q = ''): Observable<Invoice[]> {
    const params: any = {};
    if (status && status !== 'all') params.status = status;
    if (q) params.q = q;
    return this.http.get<Invoice[]>(`${BASE}/invoices`, { params });
  }
  invoice(id: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${BASE}/invoices/${id}`);
  }
  nextInvoiceNumber(): Observable<{ id: string }> {
    return this.http.get<{ id: string }>(`${BASE}/invoices/meta/next-number`);
  }
  createInvoice(body: any): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${BASE}/invoices`, body);
  }
  setInvoiceStatus(id: string, statut: InvoiceStatus): Observable<any> {
    return this.http.patch(`${BASE}/invoices/${id}`, { statut });
  }

  // Profil
  profile(): Observable<Record<string, any>> {
    return this.http.get<Record<string, any>>(`${BASE}/profile`);
  }
  updateProfile(body: Record<string, any>): Observable<Record<string, any>> {
    return this.http.put<Record<string, any>>(`${BASE}/profile`, body);
  }
}
