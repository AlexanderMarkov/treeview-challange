using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TreeApi.Models
{
	public class ChangeModel
	{
		public HashSet<int?> NodesToRemove { get; set; }
		public List<NewNodeDto> NodesToInsert { get; set; }
		public Dictionary<string, string> NodesToUpdate { get; set; }
	}
}
