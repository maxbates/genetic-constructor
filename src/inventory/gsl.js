import GslOperatorSchema from '../schemas/GslOperator';

export const colors = {
  blue: '#3F82FF',
  red: '#EE4444',
};

export const operators = [
  {
    id: 'geneLocus',
    name: 'Gene Locus',
    type: 'Level 1 Prefix',
    description: `Type the g operator as a prefix to a gene name to specify that gene by name`,
    examples: [
      'gHMG1',
      'gERG10[-100:50]',
    ],
    color: colors.blue,
    text: 'g',
    position: 'prefix',
  },
  {
    id: 'promoter',
    name: 'Promoter Part',
    type: 'Level 1 Prefix',
    description: `Type the p operator as a prefix to a gene name to specify that gene's promoter`,
    examples: [
      'pEFGR',
    ],
    color: colors.blue,
    text: 'p',
    position: 'prefix',
  },
  {
    id: 'terminator',
    name: 'Terminator Part',
    type: 'Level 1 Prefix',
    description: `Type the t operator as a prefix to a gene name to specify that gene's terminator`,
    examples: [
      'tErg10',
    ],
    color: colors.blue,
    text: 't',
    position: 'prefix',
  },
  {
    id: 'upstream',
    name: 'Upstream Part',
    type: 'Level 1 Prefix',
    description: `Type the u operator as a prefix to a gene name to specify that gene's upstream part`,
    examples: [
      'uHO',
    ],
    color: colors.blue,
    text: 'u',
    position: 'prefix',
  },
  {
    id: 'downstream',
    name: 'Downstream Part',
    type: 'Level 1 Prefix',
    description: `Type the d operator as a prefix to a gene name to specify that gene's downstream part`,
    examples: [
      'dHO',
    ],
    color: colors.blue,
    text: 'd',
    position: 'prefix',
  },
  {
    id: 'orf',
    name: 'Open Reading Frame (ORF)',
    type: 'Level 1 Prefix',
    description: `Type the o operator as a prefix to a gene name to specify that gene's open reading frame`,
    examples: [
      'oERG10',
    ],
    color: colors.blue,
    text: 'o',
    position: 'prefix',
  },
  {
    id: 'orfFusible',
    name: 'Fusible ORF, no stop codon',
    type: 'Level 1 Prefix',
    description: `Type the f operator as a prefix to a gene name to specify that gene's fusible open reading frame, no stop codon.`,
    examples: [
      'fERG10',
    ],
    color: colors.blue,
    text: 'f',
    position: 'prefix',
  },
  {
    id: 'mrna',
    name: 'mRNA',
    type: 'Level 1 Prefix',
    description: `Type the m operator as a prefix to a gene name to specify that gene's mRNA (ORF + terminator)`,
    examples: [
      'mERG10',
    ],
    color: colors.blue,
    text: 'm',
    position: 'prefix',
  },
  {
    id: 'subslice',
    name: 'Subslice (gene locus)',
    type: 'Level 1 Postfix',
    description: `Type the [] operator as a postfix to a gene name to specify a subslice of that gene's locus`,
    examples: [
      'gADH1[1: ∼400]',
    ],
    color: colors.blue,
    text: '[]',
    position: 'postfix',
  },
  {
    id: 'sliceStart',
    name: 'Start-relative Slice',
    type: 'Level 1 Postfix',
    description: `Type the S operator to specify slice coordinate of a gene locus relative to the Start of an open reading frame`,
    examples: [
      'gADH1[−20S:150E]',
    ],
    color: colors.blue,
    text: 'S',
  },
  {
    id: 'sliceEnd',
    name: 'End-relative Slice',
    type: 'Level 1 Postfix',
    description: `Type the E operator to specify slice coordinate of a gene locus relative to the End of an open reading frame`,
    examples: [
      'gADH1[−20S:150E]',
    ],
    color: colors.blue,
    text: 'E',
    position: 'postfix',
  },
  {
    id: 'invert',
    name: 'Invert',
    type: 'Level 1 Prefix',
    description: `Type the ! operator to invert the sequence orientation`,
    examples: [
      '!pERG10',
    ],
    color: colors.blue,
    text: '!',
    position: 'prefix',
  },
  {
    id: 'marker',
    name: 'Marker Sequence',
    type: 'Level 2 Operator',
    description: ``,
    examples: [
      'uHO ; ### ; dHO',
    ],
    color: colors.blue,
    text: '###',
    position: 'inline',
  },
  {
    id: 'approximate',
    name: 'Approximate Coordinate',
    type: 'Level 1 Prefix',
    description: ``,
    examples: [
      'gERG10[-300E: ∼200E]',
    ],
    color: colors.blue,
    text: '~',
    position: 'prefix',
  },
  {
    id: 'variable',
    name: 'Variable or External Reference',
    type: 'Level 2 Operator',
    description: ``,
    examples: [
      '@R12345',
      '@BBa_J11053',
      '@myStrongPromoter',
    ],
    color: colors.blue,
    text: '@',
    position: 'prefix',
  },
  {
    id: 'customBases',
    name: 'Custom Bases',
    type: 'Level 1 Operator',
    description: ``,
    examples: [
      '/ATGTACCGG/',
    ],
    color: colors.blue,
    text: '//',
    position: 'inline',
  },
  {
    id: 'customPeptides',
    name: 'Custom Peptides',
    type: 'Level 1 Operator',
    description: ``,
    examples: [
      '/$MYR/',
    ],
    color: colors.blue,
    text: '/$/',
    position: 'inline',
  },
  {
    id: 'knockout',
    name: 'Knockout',
    type: 'Level 2 Operator',
    description: ``,
    examples: [
      'gADH1∧',
    ],
    color: colors.blue,
    text: '^',
    position: 'postfix',
  },
  {
    id: 'replace',
    name: 'Replace',
    type: 'Level 1 Operator',
    description: ``,
    examples: [
      'pADH1>gERG10',
    ],
    color: colors.blue,
    text: '>',
    position: 'infix',
  },
]
  .map(operator => {
    return Object.assign(GslOperatorSchema.scaffold(), operator, {
      image: `/images/gsl/GSL-${operator.id}.svg`,
    });
  })
  .reduce((acc, operator) => Object.assign(acc, { [operator.id]: operator }), {});

export const operatorIds = Object.keys(operators);
