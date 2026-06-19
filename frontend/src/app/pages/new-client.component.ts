import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CardComponent, BtnComponent, SegmentedComponent, SectionTitleComponent } from '../shared/ui';
import { IconComponent } from '../shared/icon.component';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-new-client',
  standalone: true,
  imports: [FormsModule, CardComponent, BtnComponent, SegmentedComponent, SectionTitleComponent, IconComponent],
  templateUrl: './new-client.component.html',
  styleUrl: './new-client.component.css',
})
export class NewClientComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  editId = signal<string | null>(null);
  type = signal('entreprise');
  typeOpts = [
    { value: 'entreprise', label: 'Entreprise', icon: 'building' },
    { value: 'particulier', label: 'Particulier', icon: 'clients' },
  ];
  conditions = ['À réception', 'Net 15 jours', 'Net 30 jours', 'Net 45 jours', 'Net 60 jours'];
  f = { name: '', contact: '', email: '', phone: '', address: '', city: '', siret: '', conditions: 'Net 30 jours' };

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId.set(id);
      this.api.client(id).subscribe((c) => {
        this.type.set(c.type || 'entreprise');
        this.f = {
          name: c.name || '', contact: c.contact || '', email: c.email || '', phone: c.phone || '',
          address: c.address || '', city: c.city || '', siret: c.siret || '',
          conditions: c.conditions || 'Net 30 jours',
        };
      });
    }
  }

  valid() { return this.f.name.trim() && this.f.email.trim(); }
  back() { this.router.navigateByUrl(this.editId() ? `/clients/${this.editId()}` : '/clients'); }
  save() {
    if (!this.valid()) return;
    const body = { ...this.f, type: this.type() as any };
    const id = this.editId();
    const req$ = id ? this.api.updateClient(id, body) : this.api.createClient(body);
    req$.subscribe(() => this.router.navigateByUrl(id ? `/clients/${id}` : '/clients'));
  }
}
