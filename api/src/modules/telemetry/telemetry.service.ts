import { Injectable } from '@nestjs/common';
import { trace, metrics, SpanStatusCode, SpanKind } from '@opentelemetry/api';

@Injectable()
export class TelemetryService {
  private readonly tracer = trace.getTracer('launchkit-api');
  private readonly meter = metrics.getMeter('launchkit-api');

  // Custom metrics
  private readonly jobCounter = this.meter.createCounter('launchkit_jobs_total', {
    description: 'Total number of AI jobs processed',
  });

  private readonly jobDuration = this.meter.createHistogram('launchkit_job_duration_seconds', {
    description: 'Duration of AI job processing in seconds',
  });

  private readonly webhookCounter = this.meter.createCounter('launchkit_webhooks_total', {
    description: 'Total number of webhook deliveries attempted',
  });

  private readonly webhookDuration = this.meter.createHistogram('launchkit_webhook_duration_seconds', {
    description: 'Duration of webhook delivery in seconds',
  });

  private readonly apiKeyUsage = this.meter.createCounter('launchkit_api_key_usage_total', {
    description: 'Total number of API key authentications',
  });

  private readonly usageTokens = this.meter.createCounter('launchkit_usage_tokens_total', {
    description: 'Total tokens consumed across all organizations',
  });

  private readonly usageJobs = this.meter.createCounter('launchkit_usage_jobs_total', {
    description: 'Total jobs executed across all organizations',
  });

  /**
   * Create a span for job processing
   */
  createJobSpan(jobType: string, jobId: string, orgId: string) {
    return this.tracer.startSpan(`job.${jobType.toLowerCase()}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'job.id': jobId,
        'job.type': jobType,
        'org.id': orgId,
        'service.name': 'launchkit-api',
      },
    });
  }

  /**
   * Create a span for webhook delivery
   */
  createWebhookSpan(webhookId: string, url: string, event: string) {
    return this.tracer.startSpan('webhook.deliver', {
      kind: SpanKind.CLIENT,
      attributes: {
        'webhook.id': webhookId,
        'webhook.url': url,
        'webhook.event': event,
        'service.name': 'launchkit-api',
      },
    });
  }

  /**
   * Create a span for database operations
   */
  createDbSpan(operation: string, table: string, query?: string) {
    return this.tracer.startSpan(`db.${operation}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'db.operation': operation,
        'db.table': table,
        'db.query': query || '',
        'service.name': 'launchkit-api',
      },
    });
  }

  /**
   * Create a span for external API calls
   */
  createExternalApiSpan(service: string, operation: string, url: string) {
    return this.tracer.startSpan(`external.${service}.${operation}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'external.service': service,
        'external.operation': operation,
        'http.url': url,
        'service.name': 'launchkit-api',
      },
    });
  }

  /**
   * Record job metrics
   */
  recordJobMetrics(jobType: string, duration: number, success: boolean, orgId: string, tokensUsed?: number) {
    // Increment job counter
    this.jobCounter.add(1, {
      job_type: jobType,
      success: success.toString(),
      org_id: orgId,
    });

    // Record job duration
    this.jobDuration.record(duration, {
      job_type: jobType,
      success: success.toString(),
      org_id: orgId,
    });

    // Record token usage if provided
    if (tokensUsed && tokensUsed > 0) {
      this.usageTokens.add(tokensUsed, {
        job_type: jobType,
        org_id: orgId,
      });
    }

    // Record job count for usage tracking
    this.usageJobs.add(1, {
      job_type: jobType,
      org_id: orgId,
    });
  }

  /**
   * Record webhook metrics
   */
  recordWebhookMetrics(event: string, duration: number, success: boolean, statusCode?: number) {
    // Increment webhook counter
    this.webhookCounter.add(1, {
      event: event,
      success: success.toString(),
      status_code: statusCode?.toString() || 'unknown',
    });

    // Record webhook duration
    this.webhookDuration.record(duration, {
      event: event,
      success: success.toString(),
      status_code: statusCode?.toString() || 'unknown',
    });
  }

  /**
   * Record API key usage
   */
  recordApiKeyUsage(apiKeyId: string, orgId: string, success: boolean) {
    this.apiKeyUsage.add(1, {
      api_key_id: apiKeyId,
      org_id: orgId,
      success: success.toString(),
    });
  }

  /**
   * Add attributes to current span
   */
  addSpanAttributes(attributes: Record<string, string | number | boolean>) {
    const span = trace.getActiveSpan();
    if (span) {
      span.setAttributes(attributes);
    }
  }

  /**
   * Add event to current span
   */
  addSpanEvent(name: string, attributes?: Record<string, string | number | boolean>) {
    const span = trace.getActiveSpan();
    if (span) {
      span.addEvent(name, attributes);
    }
  }

  /**
   * Set span status to error
   */
  setSpanError(error: Error, message?: string) {
    const span = trace.getActiveSpan();
    if (span) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: message || error.message,
      });
    }
  }

  /**
   * Set span status to success
   */
  setSpanSuccess(message?: string) {
    const span = trace.getActiveSpan();
    if (span) {
      span.setStatus({
        code: SpanStatusCode.OK,
        message: message || 'Success',
      });
    }
  }

  /**
   * Create a span and execute a function with it
   */
  async withSpan<T>(
    name: string,
    fn: (span: any) => Promise<T>,
    attributes?: Record<string, string | number | boolean>
  ): Promise<T> {
    const span = this.tracer.startSpan(name, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'service.name': 'launchkit-api',
        ...attributes,
      },
    });

    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Create a span and execute a synchronous function with it
   */
  withSpanSync<T>(
    name: string,
    fn: (span: any) => T,
    attributes?: Record<string, string | number | boolean>
  ): T {
    const span = this.tracer.startSpan(name, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'service.name': 'launchkit-api',
        ...attributes,
      },
    });

    try {
      const result = fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });
      throw error;
    } finally {
      span.end();
    }
  }
}
