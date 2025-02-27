import { hash, isHashProofed } from './helpers'

export interface Bloco {
  cabecalho: {
    nonce: number // número aleatório que identifica um bloco sendo usado em combinação 
    // com hash para evitar que as informações dos blocos sejam manipuladas.
    hashDoBloco: string
  }
  cargaUtil: {
    sequencia: number
    carimboDeDataHora: number
    dados: any
    hashAnterior: string
  }
}

export class CadeiaDeBlocos {
  #cadeia: Bloco[] = []
  private prefixoDeProvaDeTrabalho = '0'

  constructor (private readonly dificuldade: number = 4) {
    this.#cadeia.push(this.criarBlocoGenesis())
  }

  private criarBlocoGenesis () { 
    const cargaUtil = {
      sequencia: 0,
      carimboDeDataHora: +new Date(),
      dados: 'Bloco genesis',
      hashAnterior: ''
    }
    return {
      cabecalho: {
        nonce: 0,
        hashDoBloco: hash(JSON.stringify(cargaUtil))
      },
      cargaUtil
    }
  }

  private get ultimoBloco (): Bloco {
    return this.#cadeia.at(-1) as Bloco
  }

  get cadeia () {
    return this.#cadeia
  }

  private obterHashDoBlocoAnterior () {
    return this.ultimoBloco.cabecalho.hashDoBloco
  }

  criarBloco (dados: any) {
    const novoBloco = {
      sequencia: this.ultimoBloco.cargaUtil.sequencia + 1,
      carimboDeDataHora: +new Date(),
      dados,
      hashAnterior: this.obterHashDoBlocoAnterior()
    }

    console.log(`Bloco criado ${novoBloco.sequencia}: ${JSON.stringify(novoBloco, null, 2)}`)
    return novoBloco
  }

  minerarBloco (bloco: Bloco['cargaUtil']) {
    let nonce = 0
    let inicioTempo = +new Date()

    while (true) {
      const hashDoBloco = hash(JSON.stringify(bloco))
      const hashDeProva = hash(hashDoBloco + nonce)

      if (isHashProofed({
        hash: hashDeProva,
        dificuldade: this.dificuldade,
        prefixo: this.prefixoDeProvaDeTrabalho
      })) {
        const fimTempo = +new Date()
        const hashCurto = hashDoBloco.slice(0, 12)
        const tempoDeMineracao = (fimTempo - inicioTempo) / 1000

        console.log(`Bloco Minerado ${bloco.sequencia} em ${tempoDeMineracao} segundos. Hash: ${hashCurto} (${nonce} Tentativas)`)

        return {
          blocoMinerado: { cargaUtil: { ...bloco }, cabecalho: { nonce, hashDoBloco } },
          hashMinerado: hashDeProva,
          hashCurto,
          tempoDeMineracao
        }
      }
      nonce++
    }
  }

  verificarBloco (bloco: Bloco) {
    if (bloco.cargaUtil.hashAnterior !== this.obterHashDoBlocoAnterior()) {
      console.error(`Bloco inválido #${bloco.cargaUtil.sequencia}: O Hash do Bloco Anterior é "${this.obterHashDoBlocoAnterior().slice(0, 12)}" não "${bloco.cargaUtil.hashAnterior.slice(0, 12)}"`)
      return
    }

    if (!isHashProofed({
      hash: hash(hash(JSON.stringify(bloco.cargaUtil)) + bloco.cabecalho.nonce),
      dificuldade: this.dificuldade,
      prefixo: this.prefixoDeProvaDeTrabalho
    })) {
      console.error(`Bloco inválido #${bloco.cargaUtil.sequencia}: Hash não é a prova, nonce ${bloco.cabecalho.nonce} não é válido`)
      return
    }

    return true
  }

  empurrarBloco (bloco: Bloco) {
    if (this.verificarBloco(bloco)) this.#cadeia.push(bloco)
    console.log(`Bloco empurrado #${JSON.stringify(bloco, null, 2)}`)
    return this.#cadeia
  }
}
