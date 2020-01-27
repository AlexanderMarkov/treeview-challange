using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TreeApi.Extensions;
using TreeApi.Models;

namespace TreeApi.Services
{
	public interface ITreeManager
	{
		Task<Node> GetRootWithRecursiveChildrenAsync();
		Task ResetAsync();
		Task ApplyChangesAsync(ChangeModel changeModel);
	}

	public class TreeManager : ITreeManager
	{
		private readonly TreeDbContext _context;

		public TreeManager(TreeDbContext context)
		{
			_context = context;
		}

		public async Task<Node> GetRootWithRecursiveChildrenAsync()
		{
			var allNodes = await _context.Nodes.ToListAsync();
			return allNodes.SingleOrDefault(x => x.ParentId == null);
		}

		public async Task ResetAsync() => await _context.ResetAsync();

		public async Task ApplyChangesAsync(ChangeModel changeModel)
		{
			await insertAsync(changeModel.NodesToInsert);
			await updateAsync(changeModel.NodesToUpdate);
			await removeAsync(changeModel.NodesToRemove);

			await _context.SaveChangesAsync();
		}

		private async Task insertAsync(List<NewNodeDto> nodeDtos)
		{
			if (nodeDtos == null || nodeDtos.Count == 0)
			{
				return;
			}

			Node mapDto(NewNodeDto dto) => new Node
			{
				Id = dto.Id,
				Name = dto.Name,
				ParentId = dto.ParentId,
				Children = dto.Children.Select(mapDto).ToHashSet()
			};

			var dbNodes = nodeDtos.Select(mapDto);

			await _context.AddRangeAsync(dbNodes);
		}

		private async Task updateAsync(Dictionary<string, string> map)
		{
			if (map == null || map.Count == 0)
			{
				return;
			}

			var entities = await _context.Nodes.Where(x => map.Keys.Contains(x.Id.ToString())).ToListAsync();

			entities.ForEach(x => x.Name = map[x.Id.ToString()]);
		}

		private async Task removeAsync(HashSet<long?> ids)
		{
			if (ids == null || ids.Count == 0)
			{
				return;
			}

			void cascadeMarkAsRemoved(Node node)
			{
				node.IsRemoved = true;
				foreach (var c in node.Children)
				{
					cascadeMarkAsRemoved(c);
				}
			}

			// Quick & Dirty
			var allNodes = await _context.Nodes.ToListAsync();

			allNodes
				.Where(x => ids.Contains(x.Id))
				.ToList()
				.ForEach(cascadeMarkAsRemoved);
		}
	}
}
