const { mongoose } = require ('../../database/connection.js');

const areaTypes = ['Impresion Digital','Empastado', 'Tipografia'];

const materialSchema = new mongoose.Schema(
	{	
	idMaterial:{type : mongoose.Types.ObjectId, required : true} ,
	name : {type : String,required : true},
	required : {type : Number, min:1 , required : true},
	produced : {type : Number, min:1 , required : true},
	status: {type: Boolean, default:true}
	}
)

const schema = {
	name : {type: String, unique: true , required: true},
	description: {type: String},
	area: {type: String, enum: areaTypes , required: true},
	cost : {
		type:[
				{
					lot : {type : Number, min:1, required : true},
					price : {type : Number, min:1 , required : true},
					status: {type: Boolean, default:true}
				}
			],
		validate:[
			(value)=>{
				if(value.length<1)
					throw Error('Agregar costos')

				const lot = value.map(item=>item.lot);
				const setLot = new Set(lot);
				if (setLot.size !== lot.length)
					throw Error('Cantidad de costo repetido')
				return true
			}
		],
		required:true
	},
	materials :{
		type:[materialSchema],
		validate:[
			(value)=>{
				if(value.length<1)
					throw Error('Agregar materiales')

				const names = value.map(item=>item.name);
				const setNames = new Set(names);
				if (setNames.size !== names.length)
					throw Error('Material repetido')

				const ids = value.map(item=>item.idMaterial.toString());
				const setIds = new Set(ids);
				if (setIds.size !== ids.length)
					throw Error('MaterialId repetido')
				return true
			}
		],
		required:true
	},
	status: {type: Boolean, default:true}
}

const jobSchema = new mongoose.Schema(schema,{timestamps:true, versionKey:false});

const jobModel = mongoose.model('job', jobSchema);

module.exports = { jobModel };