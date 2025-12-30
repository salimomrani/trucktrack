import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * NotFoundComponent - 404 page displayed when route doesn't exist
 */
@Component({
    selector: 'app-not-found',
    imports: [RouterModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './not-found.component.html',
    styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent {
}
