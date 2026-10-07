//Define os status possíveis que um processo pode assumir no sistema.
export type StatusProcesso = "Pré-análise" | "Em revisão" | "Concluído" | "Falha na análise";

//Define os níveis de prioridade para a classificação dos processos.
export type PrioridadeProcesso = "Máxima" | "Alta" | "Média" | "Baixa";

//Define os níveis de complexidade atribuídos pela IA ou redefinidos pelo analista.
export type ComplexidadeProcesso = "FÁCIL" | "MÉDIO" | "DIFÍCIL" | "Fácil" | "Médio" | "Difícil";

//Categoriza a origem do processo
export type OrigemProcesso = 'controle' | 'interno' | 'outros';

//Estrutura do contrato com os dados detalhados de um processo SEI
export interface ProcessoSEI {
  id: number;                           //Identificador 
  numero: string;                       //Número de registro do SEI
  assunto: string;                      //Assunto do processo administrativo
  status: StatusProcesso;               //Estado atual (Pré-análise, Em revisão, Concluído, Falha na análise)
  status_processamento?: string;        //Status da fila de análise em background ("Processando", "Concluído", "Falhou")
  erro_processamento?: string;          //Mensagem técnica de erro caso o processamento falhe
  tempo_analise?: number;               //Tempo em segundos decorrido para concluir a análise de IA
  dataRecebimento: string;              //Data de entrada no sistema
  prioridade: PrioridadeProcesso;       //Grau de urgência 
  complexidade?: string;                //Grau de complexidade (FÁCIL, MÉDIO, DIFÍCIL)
  complexidade_justificativa?: string;  //Explicação técnica gerada pela IA sobre a complexidade
  alerta_ocr?: boolean;                 //Indica se o OCR falhou ou gerou texto insuficiente (por ter imagens ou texto ilegível)
  iaConfidence: number;                 //Nível de confiança da IA (valor decimal de 0 a 1)
  analista?: string;                    //Nome do revisor humano (opcional, nulo se estiver na IA)
  dataRevisao?: string;                 //Quando a revisão humana aconteceu (opcional)
  dataPreAnalise: string;               //Data que foi pré-analisado pela IA
  iaSugestao: string;                   //O texto sugerida pela IA
  minuta?: string;                      //O texto da minuta persistido no banco
  arquivoPdf?: string;                  //Caminho do arquivo PDF no GCS ou local
  jurisprudenciasSugeridas: any[];      //Lista de jurisprudências 
  fontes_consultadas_detalhadas?: Array<{
    texto: string;
    tipo: "processo" | "arquivo_base" | "norma_citada";
    tem_arquivo: boolean;
    arquivo_nome?: string | null;
    file_path?: string | null;
  }>;
  isEditadoLocalmente?: boolean;        //Indica se foi editado.
  data_emissao?: string;                //Data base para cálculo do prazo do órgão
  data_vencimento?: string;             //Data final para resposta
  dias_restantes?: number;              //Contagem de dias (pode ser negativo se estiver vencido)
  is_vencido?: boolean;                 //Flag visual para destacar os vencidos
  tem_prazo_definido?: boolean;         //Flag para saber se o processo entra na "Agenda do Dia"
  remetente?: string;                   //Tag do órgão remetente (MP, TCE, PGE, etc.)
  tipo_origem?: OrigemProcesso;         //Classificação ('controle', 'interno', 'outros')
  nivel_prioridade?: number;            //Índice numérico para facilitar ordenação
}

//Contadores numéricos das caixas de métricas do Dashboard
export interface DashboardMetrics {
  preAnalisadosIA: number;        //Quantidade de processos aguardando 
  emRevisaoHumana: number;        //Quantidade de processos em edição
  concluidos: number;             //Quantidade de análises finalizadas
  total: number;                  //Todos os processos listados no sistema
  falhasAnalise?: number;         //Quantidade de processos que falharam na IA
  processosComPrazo?: number;     //Processos na fila que possuem prazo
  processosVencidos?: number;     //Processos que já estouraram o prazo
}