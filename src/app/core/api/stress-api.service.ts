import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  CreateTestRequest,
  CreateTestResponse,
  TestListItem,
  TestDetail,
  TestSummary,
  TestTimeseries,
  PreviewRequest,
  PreviewResponse,
  ProbeRequest,
  ProbeResponse,
} from './models';

@Injectable({ providedIn: 'root' })
export class StressApiService {
  private readonly http = inject(HttpClient);

  probeHttpRequest(request: ProbeRequest): Observable<ProbeResponse> {
    return this.http.post<ProbeResponse>('/stress/tests/probe', request);
  }

  previewTemplate(request: PreviewRequest): Observable<PreviewResponse> {
    return this.http.post<PreviewResponse>('/stress/tests/preview', request);
  }

  createTest(payload: CreateTestRequest): Observable<CreateTestResponse> {
    return this.http.post<CreateTestResponse>('/stress/tests/run', payload);
  }

  startTest(testId: string): Observable<void> {
    return this.http.post<void>(`/stress/tests/${testId}/restart`, {});
  }

  stopTest(testId: string): Observable<void> {
    return this.http.post<void>(`/stress/tests/${testId}/stop`, {});
  }

  listTests(): Observable<TestListItem[]> {
    return this.http.get<TestListItem[]>('/stress/tests').pipe(
      catchError(() => of([]))
    );
  }

  getTest(testId: string): Observable<TestDetail | null> {
    return this.http.get<TestDetail>(`/stress/tests/${testId}`).pipe(
      catchError(() => of(null))
    );
  }

  getSummary(testId: string): Observable<TestSummary | null> {
    return this.http.get<TestSummary>(`/stress/tests/${testId}/summary`).pipe(
      catchError(() => of(null))
    );
  }

  getTimeseries(testId: string): Observable<TestTimeseries | null> {
    return this.http.get<TestTimeseries>(`/stress/tests/${testId}/timeseries`).pipe(
      catchError(() => of(null))
    );
  }
}
