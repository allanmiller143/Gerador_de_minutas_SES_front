//Define os status possíveis que um processo pode assumir no sistema.
export type StatusProcesso = "Pré-análise" | "Em revisão" | "Concluído";

//Define os níveis de prioridade para a classificação dos processos.
export type PrioridadeProcesso = "Alta" | "Média" | "Baixa";

//Estrutura do contrato com os dados detalhados de um processo SEI
export interface ProcessoSEI {
  id: number;                           //Identificador 
  numero: string;                       //Número de registro do SEI
  assunto: string;                      //Assunto do processo administrativo
  status: StatusProcesso;               //Estado atual (Pré-análise, Em revisão, Concluído)
  dataRecebimento: string;              //Data de entrada no sistema
  prioridade: PrioridadeProcesso;       //Grau de urgência 
  iaConfidence: number;                 //Nível de confiança da IA (valor decimal de 0 a 1)
  analista?: string;                    //Nome do revisor humano (opcional, nulo se estiver na IA)
  dataRevisao?: string;                 //Quando a revisão humana aconteceu (opcional)
  dataPreAnalise: string;               //Data que foi pré-analisado pela IA
  iaSugestao: string;                   //O texto sugerida pela IA
  minuta?: string;                      //O texto da minuta persistido no banco
  jurisprudenciasSugeridas: any[];      //Lista de jurisprudências 
  isEditadoLocalmente?: boolean;        //Indica se foi editado.
}

//Contadores numéricos das caixas de métricas do Dashboard
export interface DashboardMetrics {
  preAnalisadosIA: number;        //Quantidade de processos aguardando 
  emRevisaoHumana: number;        //Quantidade de processos em edição
  concluidos: number;             //Quantidade de análises finalizadas
  total: number;                  //Todos os processos listados no sistema
}