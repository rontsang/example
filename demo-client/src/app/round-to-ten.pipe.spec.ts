import { RoundToTenPipe } from './round-to-ten.pipe';

describe('RoundToTenPipe', () => {
  it('create an instance', () => {
    const pipe = new RoundToTenPipe();
    expect(pipe).toBeTruthy();
  });
});
