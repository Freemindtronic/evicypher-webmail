import { sha256, asyncSha256 } from 'legacy-code/utils'

describe('Digest algorithms work', () => {
  it('should digest a string', async () => {
    const digest = sha256(new TextEncoder().encode('test'))
    expect(digest).to.be.a('uint8array')
    expect(digest).to.have.lengthOf(32)
    const refDigest = await asyncSha256(new TextEncoder().encode('test'))
    expect(digest).to.deep.equal(refDigest)
  })
})
