import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { StressApiService } from '../../../../core/api/stress-api.service';
import { CreateTestRequest, TestType, TargetConfig, HttpMethod, PreviewResponse, ProbeResponse, ProbeRequest, LoadConfig } from '../../../../core/api/models';
import { formatDuration } from '../../../../shared/utils/formatters';

function urlValidator(control: AbstractControl) {
  if (!control.value) return null;
  try { new URL(control.value); return null; } catch { return { invalidUrl: true }; }
}

@Component({
  selector: 'app-test-wizard',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatStepperModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatTooltipModule, MatChipsModule, MatProgressSpinnerModule, MatSnackBarModule, MatRadioModule
  ],
  templateUrl: './test-wizard.component.html',
  styleUrls: ['./test-wizard.component.css']
})
export class TestWizardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(StressApiService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly testTypes: { type: TestType; label: string; icon: string; description: string; available: boolean }[] = [
    { type: 'HTTP',  label: 'HTTP/REST',        icon: '🌐', description: 'Testar APIs REST e serviços web',          available: true  },
    { type: 'KAFKA', label: 'Apache Kafka',      icon: '⚡', description: 'Testar produtores de mensagens Kafka',     available: true },
    { type: 'MQ',    label: 'Fila de Mensagens', icon: '📬', description: 'Testar RabbitMQ ou outros sistemas MQ',    available: true }
  ];

  readonly httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  readonly slaMetrics = ['avgLatencyMs', 'p95LatencyMs', 'errorRate', 'rpsCurrent'];
  readonly slaOperators = ['>', '<', '>=', '<='];

  stepOneForm!: FormGroup;
  stepConfigForm!: FormGroup;
  stepLoadForm!: FormGroup;

  saving = false;
  formatDuration = formatDuration;

  previewLoading = false;
  previewResult: PreviewResponse | null = null;
  previewError: string | null = null;

  probeLoading = false;

  get selectedType(): TestType { return this.stepOneForm.get('testType')?.value; }
  get isHttpType(): boolean { return this.selectedType === 'HTTP'; }
  get isKafkaType(): boolean { return this.selectedType === 'KAFKA'; }
  get isMqType(): boolean { return this.selectedType === 'MQ'; }

  get headers(): FormArray { return this.stepConfigForm.get('headers') as FormArray; }
  get thresholds(): FormArray { return this.stepLoadForm.get('thresholds') as FormArray; }

  get needsBody(): boolean {
    const m: HttpMethod = this.stepConfigForm.get('method')?.value;
    return ['POST', 'PUT', 'PATCH'].includes(m);
  }

  get needsTemplateValidation(): boolean {
    return this.isKafkaType || this.isMqType || (this.isHttpType && this.needsBody);
  }

  get estimatedTotalSeconds(): number {
    const d  = this.stepLoadForm.get('durationSeconds')?.value ?? 0;
    const ru = this.stepLoadForm.get('rampUpSeconds')?.value   ?? 0;
    const rd = this.stepLoadForm.get('rampDownSeconds')?.value ?? 0;
    // Only return a value if it's duration-based
    if (this.stepLoadForm.get('loadType')?.value === 'duration') {
      return Number(d) + Number(ru) + Number(rd);
    }
    return Number(ru) + Number(rd);
  }

  ngOnInit(): void {
    this.stepOneForm = this.fb.group({
      name:        ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      testType:    ['HTTP', Validators.required]
    });

    this.stepConfigForm = this.fb.group({
      // HTTP
      url:     [''],
      method:  ['GET' as HttpMethod, Validators.required],
      headers: this.fb.array([]),
      body:    [''],
      // Kafka
      topic:                [''],
      kafkaKey:             [''],
      kafkaMessageTemplate: ['{"key": "{{uuid}}", "value": "{{timestamp}}"}'],
      // MQ
      queueName:            [''],
      routingKey:           [''],
      mqMessageTemplate:    ['{"orderId": "{{orderId}}", "timestamp": "{{timestamp}}"}']
    });

    this.stepLoadForm = this.fb.group({
      loadType:        ['duration', Validators.required],
      virtualUsers:    [10,  [Validators.required, Validators.min(1)]],
      durationSeconds: [60,  [Validators.required, Validators.min(1)]],
      totalRequests:   [null, []],
      rampUpSeconds:   [0,  [Validators.required, Validators.min(0)]],
      rampDownSeconds: [0,  [Validators.required, Validators.min(0)]],
      thinkTimeMillis: [0,   [Validators.required, Validators.min(0)]],
      thresholds:      this.fb.array([])
    });

    this.stepLoadForm.get('loadType')?.valueChanges.subscribe(type => {
      const durationControl = this.stepLoadForm.get('durationSeconds');
      const requestsControl = this.stepLoadForm.get('totalRequests');

      if (type === 'duration') {
        durationControl?.setValidators([Validators.required, Validators.min(1)]);
        requestsControl?.clearValidators();
        requestsControl?.setValue(null);
      } else {
        requestsControl?.setValidators([Validators.required, Validators.min(1)]);
        durationControl?.clearValidators();
        durationControl?.setValue(null);
      }
      durationControl?.updateValueAndValidity();
      requestsControl?.updateValueAndValidity();
    });


    this.stepConfigForm.valueChanges.subscribe(() => {
      this.previewResult = null;
      this.previewError = null;
    });
  }

  testHttpConfiguration(): void {
    if (this.stepConfigForm.get('url')?.invalid) {
      this.snackBar.open('A URL de destino é inválida.', 'Fechar', { duration: 3000 });
      return;
    }

    this.probeLoading = true;

    const sc = this.stepConfigForm.value;
    const headersMap: Record<string, string> = {};
    (sc.headers as { key: string; value: string }[]).forEach(h => {
      if (h.key) headersMap[h.key] = h.value;
    });

    const request: ProbeRequest = {
      url: sc.url,
      method: sc.method,
      headers: headersMap,
      body: this.needsBody ? (sc.body ?? '') : undefined
    };

    this.api.probeHttpRequest(request).subscribe({
      next: (res) => {
        this.probeLoading = false;
        if (res.error) {
          this.snackBar.open(`Falha na conexão: ${res.error}`, 'Fechar', { duration: 5000, panelClass: 'error-snackbar' });
        } else {
          this.snackBar.open(`Conexão bem-sucedida! Status: ${res.status}`, 'Fechar', { duration: 3000 });
        }
      },
      error: (err) => {
        this.probeLoading = false;
        const message = err.error?.message || 'Ocorreu um erro ao testar a conexão.';
        this.snackBar.open(message, 'Fechar', { duration: 5000, panelClass: 'error-snackbar' });
      }
    });
  }


  selectTestType(type: TestType, available: boolean): void {
    if (!available) {
      this.snackBar.open(`Tipo "${type}" não suportado pela API atual. Apenas HTTP está disponível.`, 'Fechar', { duration: 4000 });
      return;
    }
    this.stepOneForm.patchValue({ testType: type });
    this.updateConfigValidators(type);
  }

  private updateConfigValidators(type: TestType): void {
    const urlCtrl      = this.stepConfigForm.get('url');
    const topicCtrl    = this.stepConfigForm.get('topic');
    const kafkaKeyCtrl = this.stepConfigForm.get('kafkaKey');
    const queueCtrl    = this.stepConfigForm.get('queueName');

    urlCtrl?.clearValidators();
    topicCtrl?.clearValidators();
    kafkaKeyCtrl?.clearValidators();
    queueCtrl?.clearValidators();

    if (type === 'HTTP') {
      urlCtrl?.setValidators([Validators.required, urlValidator]);
    } else if (type === 'KAFKA') {
      topicCtrl?.setValidators([Validators.required]);
    } else if (type === 'MQ') {
      queueCtrl?.setValidators([Validators.required]);
    }

    [urlCtrl, topicCtrl, kafkaKeyCtrl, queueCtrl].forEach(c => {
      c?.updateValueAndValidity();
    });
  }

  addHeader(): void {
    this.headers.push(this.fb.group({ key: ['', Validators.required], value: [''] }));
  }

  removeHeader(i: number): void { this.headers.removeAt(i); }

  addThreshold(): void {
    this.thresholds.push(this.fb.group({
      metric:   ['avgLatencyMs', Validators.required],
      operator: ['>', Validators.required],
      value:    [500, [Validators.required, Validators.min(0)]]
    }));
  }

  removeThreshold(i: number): void { this.thresholds.removeAt(i); }

  beautifyTemplate(controlName: string): void {
    const control = this.stepConfigForm.get(controlName);
    if (!control || !control.value) {
      this.snackBar.open('O campo do template está vazio.', 'Fechar', { duration: 3000 });
      return;
    }

    try {
      const ugly = control.value;
      const obj = JSON.parse(ugly);
      const pretty = JSON.stringify(obj, null, 2);
      control.setValue(pretty);
    } catch (e) {
      this.snackBar.open('JSON inválido. Não foi possível formatar.', 'Fechar', { duration: 3000, panelClass: 'error-snackbar' });
    }
  }

  validateTemplate(): void {
    let template = '';
    if (this.isHttpType && this.needsBody) {
      template = this.stepConfigForm.get('body')?.value;
    } else if (this.isKafkaType) {
      template = this.stepConfigForm.get('kafkaMessageTemplate')?.value;
    } else if (this.isMqType) {
      template = this.stepConfigForm.get('mqMessageTemplate')?.value;
    }

    if (!template) {
      this.snackBar.open('O campo do template está vazio.', 'Fechar', { duration: 3000 });
      return;
    }

    this.previewLoading = true;
    this.previewResult = null;
    this.previewError = null;

    this.api.previewTemplate({ template, testType: this.selectedType }).subscribe({
      next: (res) => {
        this.previewLoading = false;
        if (res.error) {
          this.previewError = res.error;
        } else {
          this.previewResult = res;
        }
      },
      error: (err) => {
        this.previewLoading = false;
        this.previewError = err.error?.message || 'Ocorreu um erro ao validar o template.';
      }
    });
  }

  cancel(): void { this.router.navigate(['/tests']); }

  submit(): void {
    if (this.stepOneForm.invalid || this.stepConfigForm.invalid || this.stepLoadForm.invalid) {
      this.snackBar.open('Preencha todos os campos obrigatórios.', 'Fechar', { duration: 3000 });
      return;
    }

    const s1 = this.stepOneForm.value;
    const sc = this.stepConfigForm.value;
    const sl = this.stepLoadForm.value;

    let target: TargetConfig = {};

    if (this.isHttpType) {
      const headersMap: Record<string, string> = {};
      (sc.headers as { key: string; value: string }[]).forEach(h => {
        if (h.key) headersMap[h.key] = h.value;
      });
      target = {
        url:     sc.url,
        method:  sc.method,
        headers: headersMap,
        body:    this.needsBody ? (sc.body ?? '') : undefined
      };
    } else if (this.isKafkaType) {
      target = {
        topic:            sc.topic,
        kafkaKey:         sc.kafkaKey,
        messageTemplate:  sc.kafkaMessageTemplate,
      };
    } else if (this.isMqType) {
      target = {
        queueName:       sc.queueName,
        routingKey:      sc.routingKey,
        messageTemplate: sc.mqMessageTemplate
      };
    }

    const load: LoadConfig = {
      virtualUsers:    Number(sl.virtualUsers),
      rampUpSeconds:   Number(sl.rampUpSeconds),
      rampDownSeconds: Number(sl.rampDownSeconds),
      thinkTimeMillis: Number(sl.thinkTimeMillis)
    };

    if (sl.loadType === 'duration') {
      load.durationSeconds = Number(sl.durationSeconds);
    } else {
      load.totalRequests = Number(sl.totalRequests);
    }

    const payload: CreateTestRequest = {
      name: s1.name,
      testType: s1.testType,
      target: target,
      load: load
    };

    this.saving = true;
    this.api.createTest(payload).subscribe({
      next: (res) => {
        this.saving = false;
        this.snackBar.open('Teste criado com sucesso!', 'Fechar', { duration: 3000 });
        this.router.navigate(['/tests', res.testId]);
      },
      error: () => { this.saving = false; }
    });
  }
}