export type BackgroundJobName = "healthcheck";

export type BackgroundJob<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  name: BackgroundJobName;
  payload: TPayload;
};

export interface JobQueue {
  enqueue<TPayload extends Record<string, unknown>>(job: BackgroundJob<TPayload>): Promise<void>;
}

export class NoopJobQueue implements JobQueue {
  public async enqueue<TPayload extends Record<string, unknown>>(
    _job: BackgroundJob<TPayload>,
  ): Promise<void> {
    return Promise.resolve();
  }
}
