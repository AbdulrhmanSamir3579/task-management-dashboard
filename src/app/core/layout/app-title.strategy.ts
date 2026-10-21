import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { type RouterStateSnapshot, TitleStrategy } from '@angular/router';

export const APP_NAME = 'Task Manager';

/** Browser tab title: "Tasks · Task Manager", from the `title` of the active route. */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const page = this.buildTitle(snapshot);
    this.title.setTitle(page ? `${page} · ${APP_NAME}` : APP_NAME);
  }
}
