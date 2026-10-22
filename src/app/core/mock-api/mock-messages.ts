import type { HttpRequest } from '@angular/common/http';
import type { RequestInfo } from 'angular-in-memory-web-api';

type MessageId = 'titleAndAssignee' | 'taskNotFound' | 'unknownAssignee' | 'readOnly';

/**
 * The mock server's own error messages, in the languages it speaks. Like a real backend,
 * it picks one from the request's `Accept-Language` header, sent by the app.
 */
const MESSAGES: Readonly<Record<'en' | 'ar', Record<MessageId, (value: string) => string>>> = {
  en: {
    titleAndAssignee: () => 'A task needs a title and a known assignee.',
    taskNotFound: (id) => `Task ${id} was not found.`,
    unknownAssignee: (id) => `Assignee ${id} does not exist.`,
    readOnly: (collection) => `The ${collection} collection is read-only.`,
  },
  ar: {
    titleAndAssignee: () => 'تحتاج المهمة إلى عنوان ومسؤول معروف.',
    taskNotFound: (id) => `لم يتم العثور على المهمة ${id}.`,
    unknownAssignee: (id) => `المسؤول ${id} غير موجود.`,
    readOnly: (collection) => `المجموعة ${collection} للقراءة فقط.`,
  },
};

export function mockMessage(reqInfo: RequestInfo, id: MessageId, value = ''): string {
  // The library types the request loosely; it is Angular's HttpRequest.
  const { headers } = reqInfo.req as HttpRequest<unknown>;
  const language = headers.get('Accept-Language')?.startsWith('ar') ? 'ar' : 'en';
  return MESSAGES[language][id](value);
}
