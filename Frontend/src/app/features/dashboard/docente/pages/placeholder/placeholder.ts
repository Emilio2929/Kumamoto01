import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

type PlaceholderData = {
  title?: string;
  description?: string;
};

@Component({
  selector: 'app-placeholder-docente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './placeholder.html',
  styleUrl: './placeholder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceholderDocenteComponent {
  private readonly route = inject(ActivatedRoute);

  data = this.route.snapshot.data as PlaceholderData;
}

