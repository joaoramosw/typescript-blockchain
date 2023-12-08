import { hash, isHashProofed } from './helpers'

export interface Block {
  header: {
    nonce: number //num aleatório que identifica um bloco sendo usado em combinação 
    //com hash para evitar que as info dos blocos sejam manipuladas.
    blockHash: string
  }
  payload: {
    sequence: number
    timestamp: number
    data: any
    previousHash: string
  }
}

export class BlockChain {
  #chain: Block[] = []
  private powPrefix = '0'

  constructor (private readonly difficulty: number = 4) {
    this.#chain.push(this.createGenesisBlock())
  }

  private createGenesisBlock () { 
    const payload = {
      sequence: 0,
      timestamp: +new Date(),
      data: 'Bloco genesis',
      previousHash: ''
    }
    return {
      header: {
        nonce: 0,
        blockHash: hash(JSON.stringify(payload))
      },
      payload
    }
  }

  private get lastBlock (): Block {
    return this.#chain.at(-1) as Block
  }

  get chain () {
    return this.#chain
  }

  private getPreviousBlockHash () {
    return this.lastBlock.header.blockHash
  }

  createBlock (data: any) {
    const newBlock = {
      sequence: this.lastBlock.payload.sequence + 1,
      timestamp: +new Date(),
      data,
      previousHash: this.getPreviousBlockHash()
    }

    console.log(`Bloco criado ${newBlock.sequence}: ${JSON.stringify(newBlock, null, 2)}`)
    return newBlock
  }

  mineBlock (block: Block['payload']) {
    let nonce = 0
    let startTime = +new Date()

    while (true) {
      const blockHash = hash(JSON.stringify(block))
      const proofingHash = hash(blockHash + nonce)

      if (isHashProofed({
        hash: proofingHash,
        difficulty: this.difficulty,
        prefix: this.powPrefix
      })) {
        const endTime = +new Date()
        const shortHash = blockHash.slice(0, 12)
        const mineTime = (endTime - startTime) / 1000

        console.log(`Bloco Minerado ${block.sequence} em ${mineTime} segundos. Hash: ${shortHash} (${nonce} Tentativas)`)

        return {
          minedBlock: { payload: { ...block }, header: { nonce, blockHash } },
          minedHash: proofingHash,
          shortHash,
          mineTime
        }
      }
      nonce++
    }
  }

  verifyBlock (block: Block) {
    if (block.payload.previousHash !== this.getPreviousBlockHash()) {
      console.error(`Bloco inválido #${block.payload.sequence}:O Hash do Bloco Anterior é "${this.getPreviousBlockHash().slice(0, 12)}" não "${block.payload.previousHash.slice(0, 12)}"`)
      return
    }

    if (!isHashProofed({
      hash: hash(hash(JSON.stringify(block.payload)) + block.header.nonce),
      difficulty: this.difficulty,
      prefix: this.powPrefix
    })) {
      console.error(`Bloco inválido #${block.payload.sequence}: Hash não é a prova, nonce ${block.header.nonce} não é válido`)
      return
    }

    return true
  }

  pushBlock (block: Block) {
    if (this.verifyBlock(block)) this.#chain.push(block)
    console.log(`Bloco empurrado #${JSON.stringify(block, null, 2)}`)
    return this.#chain
  }
}
