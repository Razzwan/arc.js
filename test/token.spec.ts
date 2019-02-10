import { first} from 'rxjs/operators'
import { Arc, IContractAddresses } from '../src/arc'
import { Token } from '../src/token'
import { Address } from '../src/types'
import { getArc, getContractAddresses, waitUntilTrue } from './utils'

jest.setTimeout(10000)
/**
 * Token test
 */
describe('Token', () => {
  let addresses: IContractAddresses
  let arc: Arc
  let address: Address

  beforeAll(async () => {
    arc = getArc()
    addresses = getContractAddresses()
    address = addresses.dao.DAOToken
  })

  it('Token is instantiable', () => {
    const token = new Token(address, arc)
    expect(token).toBeInstanceOf(Token)
    expect(token.address).toBe(address)
  })

  it('get the token state', async () => {
    const token = new Token(address, arc)
    const state = await token.state.pipe(first()).toPromise()
    expect(Object.keys(state)).toEqual(['address', 'name', 'owner', 'symbol', 'totalSupply'])
    const expected = {
       address: address.toLowerCase()
    }
    expect(state).toMatchObject(expected)
  })

  it('throws a reasonable error if the contract does not exist', async () => {
    expect.assertions(1)
    const token = new Token('0xFake', arc)
    await expect(token.state.toPromise()).rejects.toThrow(
      'Could not find a token contract with address 0xfake'
    )
  })

  it('get someones balance', async () => {
    const token = new Token(address, arc)
    const balanceOf = await token.balanceOf('0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1')
      .pipe(first()).toPromise()
    expect(balanceOf).toEqual(1e21)
  })

  it('see approvals', async () => {
    const token = new Token(address, arc)
    const approvals = await token.approvals('0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1')
      .pipe(first()).toPromise()
    expect(approvals).toEqual([])
    // todo: this needs a test with some approvals

  })

  it('approveForStaking works and is indexed property', async () => {
    const token = new Token(arc.getContract('DAOToken').options.address, arc)
    const amount = 31415
    await token.approveForStaking(amount).send()

    let allowances: any[] = []

    token.allowances({ owner: arc.web3.eth.defaultAccount}).subscribe(
      (next: any) => allowances = next
    )
    await waitUntilTrue(() => allowances.length > 0 && allowances[0].amount >= amount)
    expect(allowances).toContainEqual({
      amount,
      owner: arc.web3.eth.defaultAccount.toLowerCase(),
      spender: arc.getContract('GenesisProtocol').options.address.toLowerCase()
    })
  })
})
