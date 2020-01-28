using System.Collections.Generic;

namespace TreeApi.Models
{
	public class ChangeModel
	{
		public HashSet<long> NodesToRemove { get; set; }
		public List<NewNodeDto> NodesToInsert { get; set; }
		public Dictionary<string, string> NodesToUpdate { get; set; }
	}
}
