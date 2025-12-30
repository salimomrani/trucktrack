import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/breadcrumb/breadcrumb.component';
import { GroupService, GroupDetailResponse, CreateGroupRequest, UpdateGroupRequest } from '../group.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

/**
 * Group form component for create and edit.
 * T142-T143: GroupFormComponent full implementation
 * Feature: 002-admin-panel
 */
@Component({
    selector: 'app-group-form',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatDividerModule,
        MatChipsModule,
        BreadcrumbComponent
    ],
    templateUrl: './group-form.component.html',
    styleUrls: ['./group-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly groupService = inject(GroupService);
  private readonly toast = inject(ToastService);

  // State
  groupId = signal<string | null>(null);
  group = signal<GroupDetailResponse | null>(null);
  loading = signal(false);
  saving = signal(false);

  isEditMode = signal(false);

  breadcrumbItems = computed((): BreadcrumbItem[] => [
    { label: 'Groups', link: '/admin/groups', icon: 'workspaces' },
    { label: this.isEditMode() ? 'Edit' : 'New Group' }
  ]);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]]
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.groupId.set(id);
      this.isEditMode.set(true);
      this.loadGroup(id);
    }
  }

  loadGroup(id: string) {
    this.loading.set(true);
    this.groupService.getGroupById(id).subscribe({
      next: (group) => {
        this.group.set(group);
        this.form.patchValue({
          name: group.name,
          description: group.description || ''
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load group:', err);
        this.toast.error('Failed to load group');
        this.loading.set(false);
        this.router.navigate(['/admin/groups']);
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);

    if (this.isEditMode()) {
      this.updateGroup();
    } else {
      this.createGroup();
    }
  }

  private createGroup() {
    const request: CreateGroupRequest = {
      name: this.form.value.name,
      description: this.form.value.description || undefined
    };

    this.groupService.createGroup(request).subscribe({
      next: (group) => {
        this.toast.success(`Group "${group.name}" created successfully`);
        this.router.navigate(['/admin/groups']);
      },
      error: (err) => {
        console.error('Failed to create group:', err);
        this.toast.error(err.error?.message || 'Failed to create group');
        this.saving.set(false);
      }
    });
  }

  private updateGroup() {
    const request: UpdateGroupRequest = {
      name: this.form.value.name,
      description: this.form.value.description || undefined
    };

    this.groupService.updateGroup(this.groupId()!, request).subscribe({
      next: (group) => {
        this.toast.success(`Group "${group.name}" updated successfully`);
        this.router.navigate(['/admin/groups']);
      },
      error: (err) => {
        console.error('Failed to update group:', err);
        this.toast.error(err.error?.message || 'Failed to update group');
        this.saving.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/groups']);
  }
}
